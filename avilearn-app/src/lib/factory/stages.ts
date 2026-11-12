import { createAdminClient } from '@/lib/supabase/server';
import { runIntakeAgent } from '@/lib/agents/intake';
import { runEnrichmentAgent } from '@/lib/agents/enrichment';
import { runTransformRouterAgent } from '@/lib/agents/transform-router';
import { parsePdf } from '@/lib/transform/pdf-parser';
import { parsePptxBuffer } from '@/lib/transform/pptx-parser';
import type { ParsedSlide } from '@/lib/transform/types';
import { BUCKET } from './supabase-store';
import { NonRetryableError, type StageDef } from './types';

type RoutedLesson = {
  title: string;
  contentType: 'html' | 'video' | 'simulation';
  durationMinutes: number;
  htmlCode?: string;
};

async function downloadSource(storagePath: string): Promise<Buffer> {
  const { data, error } = await createAdminClient().storage.from(BUCKET).download(storagePath);
  if (error || !data) throw new Error(`Cannot download source file: ${error?.message ?? 'empty'}`);
  return Buffer.from(await data.arrayBuffer());
}

const intake: StageDef = {
  name: 'intake',
  timeoutMs: 10 * 60 * 1000,
  async run(ctx) {
    const { job } = ctx;
    if (job.sourceFormat !== 'pptx' && job.sourceFormat !== 'pdf') {
      throw new NonRetryableError(`Format "${job.sourceFormat}" is not supported yet (planned: docx = phase 3, mp4 = phase 6).`);
    }
    const buffer = await downloadSource(job.storagePath);
    let slides: Omit<ParsedSlide, 'classification'>[];
    if (job.sourceFormat === 'pdf') {
      await ctx.progress('Extracting text from PDF');
      const raw = await parsePdf(buffer);
      if (!raw.trim()) throw new NonRetryableError('PDF has no extractable text (scanned file?). OCR is not built yet.');
      await ctx.progress('Intake agent: structuring text into slides');
      slides = await runIntakeAgent(raw, job.fileName, job.moduleId);
    } else {
      await ctx.progress('Parsing PPTX with python-pptx');
      slides = await parsePptxBuffer(buffer, job.fileName);
    }
    const images = slides.reduce((n, s) => n + (s.images?.length ?? 0), 0);
    await ctx.progress(`Intake found ${slides.length} slides, ${images} images`, { slides: slides.length, images });
    await ctx.writeArtifact('intake', slides);
  },
};

const enrichment: StageDef = {
  name: 'enrichment',
  timeoutMs: 5 * 60 * 1000, // normal run is about 30 s
  async run(ctx) {
    const slides = await ctx.readArtifact<Omit<ParsedSlide, 'classification'>[]>('intake');
    if (!slides) throw new Error('Missing intake artifact');
    await ctx.progress('Classifying slides');
    const enriched = await runEnrichmentAgent(slides, ctx.job.moduleId);
    await ctx.writeArtifact('enrichment', enriched);
  },
};

const routing: StageDef = {
  name: 'routing',
  timeoutMs: 25 * 60 * 1000, // writes HTML for every lesson
  async run(ctx) {
    const slides = await ctx.readArtifact<ParsedSlide[]>('enrichment');
    if (!slides) throw new Error('Missing enrichment artifact');
    await ctx.progress('Grouping slides into lessons and rendering HTML5');
    const lessons = (await runTransformRouterAgent(slides, ctx.job.moduleId)) as RoutedLesson[];
    for (const l of lessons) {
      if (l.contentType === 'simulation' && !l.htmlCode) {
        ctx.addSmeFlags([`Lesson "${l.title}" is a simulation with no content yet. Run the simulation generator for it.`]);
      }
      if (l.contentType === 'video') {
        ctx.addSmeFlags([`Lesson "${l.title}" is a placeholder video. No real video was rendered.`]);
      }
    }
    await ctx.writeArtifact('routing', lessons);
  },
};

const saving: StageDef = {
  name: 'saving',
  timeoutMs: 5 * 60 * 1000,
  async run(ctx) {
    const lessons = await ctx.readArtifact<RoutedLesson[]>('routing');
    if (!lessons) throw new Error('Missing routing artifact');
    const sb = createAdminClient();
    const { job } = ctx;

    // Idempotent on retry: remove lessons this job made earlier.
    await sb.from('lessons').delete().eq('factory_job_id', job.id);

    const { data: last } = await sb
      .from('lessons')
      .select('sort_order')
      .eq('module_id', job.moduleId)
      .order('sort_order', { ascending: false })
      .limit(1);
    const base = last?.[0]?.sort_order ?? 0;

    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      let contentUrl: string | null = null;
      if (l.htmlCode) {
        const p = `lessons/${job.moduleId}/${job.id}_${i + 1}.html`;
        const { error } = await sb.storage
          .from(BUCKET)
          .upload(p, new Blob([l.htmlCode], { type: 'text/html' }), { contentType: 'text/html', upsert: true });
        if (error) throw new Error(`HTML upload failed for "${l.title}": ${error.message}`);
        contentUrl = p;
      }
      const { error } = await sb.from('lessons').insert({
        module_id: job.moduleId,
        title: l.title,
        content_type: l.contentType,
        content_url: contentUrl,
        sort_order: base + i + 1,
        duration_minutes: l.durationMinutes,
        factory_job_id: job.id,
      });
      if (error) throw new Error(`Lesson insert failed for "${l.title}": ${error.message}`);
      await ctx.progress(`Saved lesson ${i + 1}/${lessons.length}: ${l.title}`);
    }
  },
};

export const FACTORY_STAGES: StageDef[] = [intake, enrichment, routing, saving];
