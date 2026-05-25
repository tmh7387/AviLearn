const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Creating a dummy PDF buffer...');
  // A minimal valid PDF structure containing simple text
  const dummyPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 45 >>
stream
BT /F1 12 Tf 72 712 Td (Root Cause Analysis Ground School) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
310
%%EOF`;

  const buffer = Buffer.from(dummyPdf);

  // We need a valid moduleId. Let's use the one in the screenshot:
  // ee73b476-4dc1-46bd-b846-9ac874600994
  const moduleId = 'ee73b476-4dc1-46bd-b846-9ac874600994';

  console.log(`Sending transformation request for moduleId: ${moduleId}...`);

  // We construct form-data manually to avoid external dependencies
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  const header = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="moduleId"\r\n\r\n` +
    `${moduleId}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="test.pdf"\r\n` +
    `Content-Type: application/pdf\r\n\r\n`;

  const footer = `\r\n--${boundary}--\r\n`;

  const payload = Buffer.concat([
    Buffer.from(header),
    buffer,
    Buffer.from(footer)
  ]);

  try {
    const response = await fetch('http://localhost:3000/api/transform', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: payload
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Error Response Body:', text);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(decoder.decode(value));
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

run();
