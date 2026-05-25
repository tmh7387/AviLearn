// Mock DOMMatrix on global scope if running in Node.js environment.
// Some versions of pdf-parse / pdfjs-dist reference this browser global during module evaluation.
if (typeof global !== 'undefined' && !(global as any).DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {};
}

// Use CommonJS require to bypass Next.js / Turbopack default export verification on ESM wrapper
const pdfParse = require('pdf-parse');

/**
 * Extracts raw text content from a PDF file buffer.
 */
export async function parsePdf(fileBuffer: Buffer): Promise<string> {
  try {
    // Instantiate the modern PDFParse class (from pdf-parse version 2.x)
    const parser = new pdfParse.PDFParse({ data: fileBuffer });
    const textResult = await parser.getText();
    await parser.destroy(); // Free parser memory
    return textResult.text || '';
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
