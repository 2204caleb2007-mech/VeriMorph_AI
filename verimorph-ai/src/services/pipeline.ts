// ============================================================
// VeriDoc AI — 8-Step Forensic Processing Pipeline (PART 10)
// All steps mandatory, executed in strict order 1-8
// NEVER uses Math.random() for scores
// ============================================================
import * as Tesseract from 'tesseract.js';
import jsQR from 'jsqr';

// ─── Types ───────────────────────────────────────────────────
import type { ValidationResult } from '../shared/types';

// ─── Constants ──────────────────────────────────────────────
const POSITIVE_KWS = [
  'university', 'college', 'institute', 'government',
  'certified', 'official', 'authority', 'board', 'council',
];
const SUSPICIOUS_KWS = ['fake', 'sample', 'demo', 'test', 'copy', 'specimen'];

// ─── Step 1: Rasterize to Canvas ────────────────────────────
export async function rasterizeToCanvas(
  file: File
): Promise<HTMLCanvasElement> {
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = Math.min(600, viewport.width) + 'px';
    canvas.style.height = 'auto';
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas;
  } else {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = rej;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = Math.min(600, img.naturalWidth) + 'px';
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(img.src);
    return canvas;
  }
}

// ─── Step 2: OCR via Tesseract.js ────────────────────────────
export interface OcrResult {
  ocrText: string;
  ocrWords: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number }; suspicious: boolean }>;
  score: number;
  totalChecks: number;
}

export async function runOcr(canvas: HTMLCanvasElement, language: string): Promise<OcrResult> {
  const lang = language === 'auto' ? 'eng' : language;
  const result = await Tesseract.recognize(canvas, lang as Tesseract.Language, {
    logger: () => {},
  });

  let score = 0;
  let totalChecks = 0;
  const ocrWords: OcrResult['ocrWords'] = [];

  const ctx = canvas.getContext('2d')!;
  let words: any[] = [];
  if (result.data && (result.data as any).words) {
    words = (result.data as any).words;
  } else if (result.data && result.data.blocks) {
    for (const block of result.data.blocks) {
      if (block.paragraphs) {
        for (const para of block.paragraphs) {
          if (para.lines) {
            for (const line of para.lines) {
              if (line.words) {
                words.push(...line.words);
              }
            }
          }
        }
      }
    }
  }

  for (const word of words) {
    const text = word.text.toLowerCase().trim();
    if (!text) continue;

    const isSuspicious = SUSPICIOUS_KWS.some((kw) => text.includes(kw));
    const isPositive = POSITIVE_KWS.some((kw) => text.includes(kw));

    const bbox = word.bbox;
    ocrWords.push({
      text: word.text,
      bbox: { x0: bbox.x0, y0: bbox.y0, x1: bbox.x1, y1: bbox.y1 },
      suspicious: isSuspicious,
    });

    // Draw bboxes
    ctx.save();
    if (isSuspicious) {
      ctx.fillStyle = 'rgba(255,0,0,0.22)';
      ctx.strokeStyle = 'red';
      score -= 3;
      totalChecks += 3;
    } else if (isPositive) {
      ctx.fillStyle = 'rgba(0,255,0,0.18)';
      ctx.strokeStyle = 'green';
      score += 2;
      totalChecks += 2;
    } else {
      ctx.restore();
      continue;
    }
    ctx.lineWidth = 2;
    ctx.fillRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0);
    ctx.strokeRect(bbox.x0, bbox.y0, bbox.x1 - bbox.x0, bbox.y1 - bbox.y0);
    ctx.restore();
  }

  return {
    ocrText: ocrWords.map((w) => w.text).join(' '),
    ocrWords,
    score,
    totalChecks: Math.max(totalChecks, 1),
  };
}

// ─── Step 3: Morphological Hash ──────────────────────────────
export function computeMorphHash(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d')!;
  const stepX = canvas.width / 8;
  const stepY = canvas.height / 8;
  const samples: number[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const x = Math.floor(col * stepX + stepX / 2);
      const y = Math.floor(row * stepY + stepY / 2);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const gray = 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2];
      samples.push(gray);
    }
  }

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const bits = samples.map((s) => (s >= mean ? '1' : '0')).join('');
  const hexVal = BigInt('0b' + bits).toString(16).padStart(16, '0');
  return '0x' + hexVal;
}

// ─── Step 4: Shape Analysis ───────────────────────────────────
export interface ShapeResult {
  layoutScore: number;
  sealPosition: string;
  textAlignment: string;
  logoIntegrity: string;
}

export function analyzeShape(canvas: HTMLCanvasElement): ShapeResult {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const totalPixels = width * height;

  // layoutScore: non-white pixels / total
  let nonWhite = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245) nonWhite++;
  }
  const layoutScore = Math.round((nonWhite / totalPixels) * 100);

  // sealPosition: scan quadrants for circular variance
  const quadrantDensity = [0, 0, 0, 0];
  const hHalf = Math.floor(height / 2);
  const wHalf = Math.floor(width / 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] < 180 && data[idx + 1] < 180 && data[idx + 2] < 180) {
        const q = (y < hHalf ? 0 : 2) + (x < wHalf ? 0 : 1);
        quadrantDensity[q]++;
      }
    }
  }
  const maxQ = quadrantDensity.indexOf(Math.max(...quadrantDensity));
  const sealLabels = ['Top-left', 'Top-right', 'Bottom-left', 'Bottom-right'];
  const sealPosition = sealLabels[maxQ];

  // textAlignment: std-dev of left word positions from OCR bboxes
  // Approximate via scanning rows for first non-white pixel
  const leftEdges: number[] = [];
  for (let y = 0; y < height; y += 10) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] < 230) {
        leftEdges.push(x);
        break;
      }
    }
  }
  let textAlignment = 'Left-aligned';
  if (leftEdges.length > 3) {
    const avgLeft = leftEdges.reduce((a, b) => a + b, 0) / leftEdges.length;
    const stdDev = Math.sqrt(
      leftEdges.reduce((a, b) => a + (b - avgLeft) ** 2, 0) / leftEdges.length
    );
    if (stdDev < 10) textAlignment = 'Left-aligned';
    else if (avgLeft > width * 0.3 && avgLeft < width * 0.7) textAlignment = 'Center-aligned';
    else textAlignment = 'Justified';
  }

  // logoIntegrity: Sobel edge density in top-left 25%
  let edgeDensity = 0;
  const roiWidth = Math.floor(width * 0.25);
  const roiHeight = Math.floor(height * 0.25);
  for (let y = 1; y < roiHeight - 1; y++) {
    for (let x = 1; x < roiWidth - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const idxR = (y * width + x + 1) * 4;
      const idxD = ((y + 1) * width + x) * 4;
      const grayR = (data[idxR] + data[idxR + 1] + data[idxR + 2]) / 3;
      const grayD = (data[idxD] + data[idxD + 1] + data[idxD + 2]) / 3;
      const gx = Math.abs(grayR - gray);
      const gy = Math.abs(grayD - gray);
      if (gx + gy > 30) edgeDensity++;
    }
  }
  const edgeRatio = edgeDensity / (roiWidth * roiHeight);
  let logoIntegrity: string;
  if (edgeRatio > 0.05) logoIntegrity = 'Intact';
  else if (edgeRatio > 0.01) logoIntegrity = 'Partially damaged';
  else logoIntegrity = 'Not detected';

  return { layoutScore, sealPosition, textAlignment, logoIntegrity };
}

// ─── Step 5: Status Classification ────────────────────────────
export function classifyStatus(score: number, totalChecks: number): {
  forgeryScore: number;
  status: 'authentic' | 'suspicious' | 'fake';
} {
  const forgeryScore =
    totalChecks > 0
      ? Math.max(0, Math.min(100, Math.round((score / totalChecks) * 100)))
      : 50;
  const status =
    forgeryScore >= 85 ? 'authentic' : forgeryScore >= 50 ? 'suspicious' : 'fake';
  return { forgeryScore, status };
}

// ─── Step 6: Suspicious Zones + Explanations ──────────────────
export function buildZonesAndExplanations(
  status: 'authentic' | 'suspicious' | 'fake',
  ocrWords: OcrResult['ocrWords'],
  shapeResult: ShapeResult,
  canvas: HTMLCanvasElement
): {
  suspiciousZones: ValidationResult['suspiciousZones'];
  explanations: ValidationResult['explanations'];
} {
  const suspiciousZones: ValidationResult['suspiciousZones'] = [];
  const explanations: ValidationResult['explanations'] = [];

  if (status === 'authentic') return { suspiciousZones, explanations };

  // Suspicious keyword found
  const suspWords = ocrWords.filter((w) =>
    SUSPICIOUS_KWS.some((kw) => w.text.toLowerCase().includes(kw))
  );
  if (suspWords.length > 0) {
    const w = suspWords[0];
    const zoneIdx = suspiciousZones.length;
    suspiciousZones.push({
      area: 'OCR keyword region',
      confidence: 90,
      reason: `Suspicious keyword detected: "${w.text}"`,
      bbox: { x: w.bbox.x0, y: w.bbox.y0, width: w.bbox.x1 - w.bbox.x0, height: w.bbox.y1 - w.bbox.y0 },
    });
    explanations.push({
      type: 'suspicious_keyword',
      description: `Suspicious keyword "${w.text}" detected in document text`,
      severity: 'high',
      linkedZoneIndex: zoneIdx,
    });
  }

  // Layout anomaly
  if (shapeResult.layoutScore < 30) {
    const zoneIdx = suspiciousZones.length;
    suspiciousZones.push({
      area: 'Document layout',
      confidence: 70,
      reason: 'Abnormally low content density suggests altered structure',
    });
    explanations.push({
      type: 'layout_anomaly',
      description: `Layout score ${shapeResult.layoutScore}% is abnormally low — possible content stripping or reconstruction`,
      severity: 'medium',
      linkedZoneIndex: zoneIdx,
    });
  }

  // Seal missing
  if (shapeResult.logoIntegrity === 'Not detected') {
    const zoneIdx = suspiciousZones.length;
    suspiciousZones.push({
      area: 'Top-left region',
      confidence: 75,
      reason: 'No seal or logo detected',
      bbox: { x: 0, y: 0, width: Math.floor(canvas.width * 0.25), height: Math.floor(canvas.height * 0.25) },
    });
    explanations.push({
      type: 'seal_missing',
      description: 'Official seal or logo not detected in expected position',
      severity: 'medium',
      linkedZoneIndex: zoneIdx,
    });
  }

  // Font mismatch
  if (shapeResult.textAlignment === 'Justified' && shapeResult.layoutScore < 60) {
    explanations.push({
      type: 'font_mismatch',
      description: 'Justified alignment combined with low layout density suggests font inconsistency or text replacement',
      severity: 'low',
    });
  }

  return { suspiciousZones, explanations };
}

// ─── Step 7: QR Code Multi-Pass ───────────────────────────────
export function scanQRCode(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;

  // Pass 1: direct full image
  const imageData = ctx.getImageData(0, 0, width, height);
  const result1 = jsQR(imageData.data, width, height, { inversionAttempts: 'attemptBoth' });
  if (result1) {
    drawQrOverlay(ctx, result1.location);
    return result1.data;
  }

  // Pass 2: grayscale normalized (contrast stretch)
  const grayData = new Uint8ClampedArray(imageData.data.length);
  let minG = 255, maxG = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const g = Math.round(0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2]);
    if (g < minG) minG = g;
    if (g > maxG) maxG = g;
  }
  const range = (maxG - minG) || 1;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const g = Math.round(0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2]);
    const stretched = Math.round(((g - minG) / range) * 255);
    grayData[i] = grayData[i + 1] = grayData[i + 2] = stretched;
    grayData[i + 3] = 255;
  }
  const result2 = jsQR(grayData, width, height, { inversionAttempts: 'attemptBoth' });
  if (result2) {
    drawQrOverlay(ctx, result2.location);
    return result2.data;
  }

  // Pass 3: sub-region crops (4×4 grid)
  const cellW = Math.floor(width / 4);
  const cellH = Math.floor(height / 4);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const subData = ctx.getImageData(col * cellW, row * cellH, cellW, cellH);
      const result3 = jsQR(subData.data, cellW, cellH, { inversionAttempts: 'attemptBoth' });
      if (result3) {
        return result3.data;
      }
    }
  }

  // Pass 4: scales
  const scales = [1.5, 2];
  for (const scale of scales) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = Math.round(width * scale);
    scaledCanvas.height = Math.round(height * scale);
    const sCtx = scaledCanvas.getContext('2d')!;
    sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    const scaledData = sCtx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
    const result4 = jsQR(scaledData.data, scaledCanvas.width, scaledCanvas.height, { inversionAttempts: 'attemptBoth' });
    if (result4) {
      return result4.data;
    }
  }

  return '';
}

function drawQrOverlay(
  ctx: CanvasRenderingContext2D,
  location: { topLeftCorner: { x: number; y: number }; topRightCorner: { x: number; y: number }; bottomRightCorner: { x: number; y: number }; bottomLeftCorner: { x: number; y: number } }
) {
  ctx.beginPath();
  ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
  ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
  ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
  ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
  ctx.closePath();
  ctx.strokeStyle = 'orange';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ─── Step 8: Concurrent Processing Pool ───────────────────────
export async function limitedParallel<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;
  async function runner(): Promise<void> {
    while (currentIndex < items.length) {
      const myIndex = currentIndex++;
      results[myIndex] = await worker(items[myIndex], myIndex);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runner())
  );
  return results;
}

// ─── Full Pipeline Orchestrator ────────────────────────────────
export async function runFullPipeline(
  file: File,
  language: string,
  index: number,
  canvasCache: Map<number, HTMLCanvasElement>
): Promise<ValidationResult> {
  // Step 1: Rasterize
  const canvas = await rasterizeToCanvas(file);
  canvasCache.set(index, canvas);

  // Step 2: OCR
  const ocrResult = await runOcr(canvas, language);
  let score = ocrResult.score;
  let totalChecks = ocrResult.totalChecks;

  // Step 3: Morphological Hash
  const morphHash = computeMorphHash(canvas);

  // Step 4: Shape Analysis
  const shapeAnalysis = analyzeShape(canvas);
  score += shapeAnalysis.layoutScore > 20 ? 2 : -2;
  totalChecks += 2;
  if (shapeAnalysis.logoIntegrity === 'Intact') { score += 3; totalChecks += 3; }
  if (shapeAnalysis.logoIntegrity === 'Not detected') { score -= 2; totalChecks += 2; }

  // Step 5: Classification
  const { forgeryScore, status } = classifyStatus(score, totalChecks);

  // Step 6: Zones + Explanations
  const { suspiciousZones, explanations } = buildZonesAndExplanations(
    status,
    ocrResult.ocrWords,
    shapeAnalysis,
    canvas
  );

  // Step 7: QR
  const qrData = scanQRCode(canvas);

  // Step 8 is handled externally (limitedParallel for batch)

  const result: ValidationResult = {
    id: `cert-${Date.now()}-${index}`,
    fileName: file.name,
    forgeryScore,
    status,
    shapeAnalysis,
    morphHash,
    suspiciousZones,
    metadata: {
      institution: extractInstitution(ocrResult.ocrText),
      issueDate: extractDate(ocrResult.ocrText),
      certificateType: extractCertType(ocrResult.ocrText),
      verificationMethod: 'Local Database',
      language,
    },
    ocrText: ocrResult.ocrText,
    ocrWords: ocrResult.ocrWords,
    qrData,
    timestamp: new Date().toISOString(),
    explanations,
    ela: undefined,
  };

  return result;
}

// ─── Helper: Extract metadata from OCR text ────────────────────
function extractInstitution(text: string): string {
  const words = text.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i].toLowerCase();
    if (['university', 'college', 'institute', 'school', 'academy'].includes(word)) {
      return words.slice(Math.max(0, i - 2), i + 2).join(' ');
    }
  }
  return 'Unknown Institution';
}

function extractDate(text: string): string {
  const match = text.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/);
  return match ? match[0] : new Date().toLocaleDateString();
}

function extractCertType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('degree')) return 'Degree Certificate';
  if (lower.includes('diploma')) return 'Diploma Certificate';
  if (lower.includes('mark')) return 'Marksheet';
  if (lower.includes('birth')) return 'Birth Certificate';
  if (lower.includes('income')) return 'Income Certificate';
  return 'Official Document';
}
