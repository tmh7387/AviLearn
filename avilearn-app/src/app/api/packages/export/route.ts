import { NextRequest, NextResponse } from 'next/server';
import { buildScormPackage } from '@/lib/scorm/zip-packager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, courseTitle, htmlContent } = body;

    if (!courseId || !courseTitle || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, courseTitle, htmlContent' },
        { status: 400 }
      );
    }

    const zipData = await buildScormPackage({
      courseId,
      courseTitle,
      files: [
        {
          path: 'index.html',
          content: wrapInScormHtml(htmlContent, courseTitle),
        },
      ],
    });

    return new NextResponse(Buffer.from(zipData), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${courseId}.zip"`,
      },
    });
  } catch (error) {
    console.error('SCORM export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SCORM package' },
      { status: 500 }
    );
  }
}

function wrapInScormHtml(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="scorm-api.js"><\/script>
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; max-width: 960px; margin: 0 auto; padding: 24px; color: #e6e9f2; background: #14171f; }
    h1, h2, h3 { margin: 1em 0 0.5em; }
    p { line-height: 1.6; margin: 0.5em 0; }
  </style>
</head>
<body>
  <script>
    window.onload = function() { ScormAPI.initialize(); };
    window.onbeforeunload = function() { ScormAPI.setComplete(); ScormAPI.terminate(); };
  <\/script>
  ${content}
</body>
</html>`;
}
