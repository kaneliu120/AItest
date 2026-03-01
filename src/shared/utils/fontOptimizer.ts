import fontsubset from 'fontsubset';

export async function optimizeFont(fontPath: string, outputPath: string, text: string) {
  await fontsubset(fontPath, outputPath, text);
  console.log(`Font optimized: ${fontPath} -> ${outputPath}`);
}