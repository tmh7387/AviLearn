import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/lessons/[lessonId]/content — Serve lesson content from Supabase Storage
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = createAdminClient();

  // Look up the lesson to get the storage path
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('id, title, content_type, content_url')
    .eq('id', lessonId)
    .single();

  if (error || !lesson) {
    return Response.json({ error: 'Lesson not found', detail: error?.message }, { status: 404 });
  }

  if (!lesson.content_url) {
    return Response.json({ error: 'No content available for this lesson', lessonId }, { status: 404 });
  }

  // Handle edge case: if content_url is a full external URL (e.g., from seed data), redirect
  if (lesson.content_url.startsWith('http://') || lesson.content_url.startsWith('https://')) {
    return Response.redirect(lesson.content_url, 302);
  }

  // Handle edge case: empty string content_url
  if (lesson.content_url.trim() === '') {
    return Response.json({ error: 'Lesson has empty content URL', lessonId }, { status: 404 });
  }

  // Download the file from Supabase Storage
  const { data: fileData, error: downloadErr } = await supabase.storage
    .from('scorm-packages')
    .download(lesson.content_url);

  if (downloadErr || !fileData) {
    console.error('[LessonContent] Download error:', downloadErr, 'path:', lesson.content_url);
    return Response.json({ 
      error: 'Failed to retrieve lesson content from storage',
      detail: downloadErr?.message,
      storagePath: lesson.content_url,
      hint: 'The file may not have been uploaded successfully. Try re-uploading the source material.',
    }, { status: 500 });
  }

  // Determine content type based on lesson type
  const contentTypeMap: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    pdf: 'application/pdf',
    video: 'video/mp4',
  };

  const mimeType = contentTypeMap[lesson.content_type] || 'application/octet-stream';

  // Return the file content directly
  return new Response(fileData, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${(lesson.title || 'lesson').replace(/"/g, "'")}.${lesson.content_type}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
