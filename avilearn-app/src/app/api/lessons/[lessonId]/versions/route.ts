import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/lessons/[lessonId]/versions
 * Returns the version history for a lesson's content from the DB.
 *
 * POST /api/lessons/[lessonId]/versions
 * Saves a new version:
 *   1. Backs up the CURRENT content to a versioned storage path
 *   2. Records it in the lesson_versions table
 *   3. Overwrites the lesson's content_url with the new HTML
 *
 * Body: { html: string, summary?: string, editInstruction?: string }
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = createAdminClient();

  const { data: versions, error } = await supabase
    .from('lesson_versions')
    .select('id, lesson_id, version_number, storage_path, summary, edit_instruction, html_char_count, edited_by, created_at')
    .eq('lesson_id', lessonId)
    .order('version_number', { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ versions: versions || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = createAdminClient();

  const body = await request.json();
  const { html, summary, editInstruction } = body;

  if (!html) {
    return Response.json({ error: 'html is required' }, { status: 400 });
  }

  // 1. Get current lesson
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('id, content_url, module_id')
    .eq('id', lessonId)
    .single();

  if (lessonErr || !lesson) {
    return Response.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // 2. Determine the next version number
  const { data: maxRow } = await supabase
    .from('lesson_versions')
    .select('version_number')
    .eq('lesson_id', lessonId)
    .order('version_number', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (maxRow?.version_number ?? 0) + 1;

  // 3. Back up the CURRENT content to a versioned storage path (before overwriting)
  if (lesson.content_url) {
    const { data: currentFile } = await supabase.storage
      .from('scorm-packages')
      .download(lesson.content_url);

    if (currentFile) {
      const currentText = await currentFile.text();
      const versionPath = `lessons/versions/${lessonId}/v${nextVersion}_${Date.now()}.html`;

      const { error: uploadVerErr } = await supabase.storage
        .from('scorm-packages')
        .upload(versionPath, new Blob([currentText], { type: 'text/html' }), {
          contentType: 'text/html',
          upsert: false,
        });

      if (!uploadVerErr) {
        // 4. Insert the version record into the DB
        await supabase.from('lesson_versions').insert({
          lesson_id: lessonId,
          version_number: nextVersion,
          storage_path: versionPath,
          summary: summary || 'AI edit',
          edit_instruction: editInstruction || null,
          html_char_count: currentText.length,
          // edited_by: null — TODO: pass user ID from auth context when RLS is enabled
        });
      }
    }
  }

  // 5. Upload the NEW HTML to the lesson's content path (overwrite)
  const contentPath = lesson.content_url || `lessons/${lessonId}/content_${Date.now()}.html`;

  const { error: uploadErr } = await supabase.storage
    .from('scorm-packages')
    .upload(contentPath, new Blob([html], { type: 'text/html' }), {
      contentType: 'text/html',
      upsert: true,
    });

  if (uploadErr) {
    return Response.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  // 6. Update the lesson's content_url if it was newly created
  if (!lesson.content_url) {
    await supabase
      .from('lessons')
      .update({ content_url: contentPath })
      .eq('id', lessonId);
  }

  return Response.json({
    saved: true,
    contentPath,
    versionNumber: nextVersion,
    summary: summary || 'AI edit',
  });
}
