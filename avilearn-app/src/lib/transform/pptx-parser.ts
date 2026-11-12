import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import type { ParsedSlide } from './types';

const execFileP = promisify(execFile);

/**
 * Parse a PPTX buffer with resources/parse_pptx.py (python-pptx).
 * Python command comes from FACTORY_PYTHON (default "python"; use "python3" on Mac/Linux).
 */
export async function parsePptxBuffer(
  buffer: Buffer,
  fileName: string
): Promise<Omit<ParsedSlide, 'classification'>[]> {
  const tempDir = path.join(process.cwd(), '..', 'env', 'tmp');
  fs.mkdirSync(tempDir, { recursive: true });
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const tempPath = path.join(tempDir, `${Date.now()}_${safe}`);
  fs.writeFileSync(tempPath, buffer);

  try {
    const scriptPath = path.join(process.cwd(), '..', 'resources', 'parse_pptx.py');
    const { stdout } = await execFileP(process.env.FACTORY_PYTHON || 'python', [scriptPath, tempPath], {
      maxBuffer: 100 * 1024 * 1024,
    });
    const result = JSON.parse(stdout);
    if (result.error) throw new Error(result.error);
    return result.slides;
  } finally {
    try {
      fs.unlinkSync(tempPath);
    } catch {
      /* ignore */
    }
  }
}
