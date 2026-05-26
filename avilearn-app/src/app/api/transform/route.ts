import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runIntakeAgent } from '@/lib/agents/intake';
import { runEnrichmentAgent } from '@/lib/agents/enrichment';
import { runTransformRouterAgent } from '@/lib/agents/transform-router';
import { parsePdf } from '@/lib/transform/pdf-parser';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

export const maxDuration = 300; // Allow up to 5 min for full transformation pipeline

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const moduleId = formData.get('moduleId') as string | null;

  if (!file || !moduleId) {
    return Response.json({ error: 'file and moduleId are required' }, { status: 400 });
  }

  // Validate module exists
  const { data: mod, error: modErr } = await supabase
    .from('modules')
    .select('id, title')
    .eq('id', moduleId)
    .single();

  if (modErr || !mod) {
    return Response.json({ error: 'Module not found' }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(progress: { step: string; message: string; data?: Record<string, unknown> }) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(progress)}\n\n`)
        );
      }

      try {
        let parsedSlides = [];
        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        const isPptx = file.name.toLowerCase().endsWith('.pptx');

        if (isPdf) {
          send({ step: 'intake', message: 'Extracting text from PDF...' });
          const buffer = Buffer.from(await file.arrayBuffer());
          const rawText = await parsePdf(buffer);
          
          send({ step: 'intake', message: 'Intake Agent: Structuring PDF text into slides...' });
          parsedSlides = await runIntakeAgent(rawText, file.name, moduleId);
        } else if (isPptx) {
          send({ step: 'intake', message: 'Saving presentation locally...' });
          const tempDir = path.join(process.cwd(), '..', 'env', 'tmp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          const tempPath = path.join(tempDir, `${Date.now()}_${file.name}`);
          const buffer = Buffer.from(await file.arrayBuffer());
          fs.writeFileSync(tempPath, buffer);

          send({ step: 'intake', message: 'Executing python-pptx slide parser...' });
          const scriptPath = path.join(process.cwd(), '..', 'resources', 'parse_pptx.py');
          
          const { stdout } = await execPromise(`python "${scriptPath}" "${tempPath}"`);
          
          // Cleanup
          try { fs.unlinkSync(tempPath); } catch {}

          const result = JSON.parse(stdout);
          if (result.error) {
            throw new Error(result.error);
          }
          parsedSlides = result.slides;
        } else {
          throw new Error('Unsupported file format. Please upload PPTX or PDF.');
        }

        // Step 2: Enrichment Agent
        send({ step: 'enrichment', message: 'Enrichment Agent: Classifying slides semantically...' });
        const enrichedSlides = await runEnrichmentAgent(parsedSlides, moduleId);

        // Step 3: Transform Router Agent
        send({ step: 'routing', message: 'Transform Router Agent: Grouping lessons and rendering layout...' });
        const routedLessons = await runTransformRouterAgent(enrichedSlides, moduleId);

        // Step 4: Save lessons & upload assets to Supabase Storage
        send({ step: 'saving', message: 'Saving generated lessons to database...' });
        for (let i = 0; i < routedLessons.length; i++) {
          const lesson = routedLessons[i];
          let storagePath: string | null = null;

          if (lesson.htmlCode) {
            storagePath = `lessons/${moduleId}/lesson_${i + 1}_${Date.now()}.html`;
            
            // Upload HTML slide deck to storage bucket
            const { error: uploadErr } = await supabase.storage
              .from('scorm-packages')
              .upload(storagePath, new Blob([lesson.htmlCode], { type: 'text/html' }), {
                contentType: 'text/html',
                upsert: true,
              });

            if (uploadErr) {
              console.error(`[Transform] Storage upload failed for ${lesson.title}:`, uploadErr);
              send({ step: 'saving', message: `⚠ Storage upload failed for "${lesson.title}": ${uploadErr.message}` });
              storagePath = null; // Don't save a broken content_url
            }
          }

          // Insert lesson row
          await supabase.from('lessons').insert({
            module_id: moduleId,
            title: lesson.title,
            content_type: lesson.contentType,
            content_url: storagePath || null,
            sort_order: i + 1,
            duration_minutes: lesson.durationMinutes,
          });
        }

        send({
          step: 'complete',
          message: `Successfully processed file and generated ${routedLessons.length} lessons.`,
          data: { count: routedLessons.length },
        });

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        send({ step: 'error', message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
