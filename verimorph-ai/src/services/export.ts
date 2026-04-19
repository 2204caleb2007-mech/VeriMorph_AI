// ============================================================
// PART 9 — Export Service (lib/export.ts)
// Excel (xlsx) + PDF report download
// No Math.random() — no TODOs
// ============================================================
import * as XLSX from 'xlsx';
import type { ValidationResult } from '../shared/types';

// ─── Excel Export ────────────────────────────────────────────
export function exportToExcel(results: ValidationResult[]): void {
  const rows = results.map((r) => ({
    ID: r.id,
    Filename: r.fileName,
    'Forgery Score': r.forgeryScore,
    Status: r.status,
    'Morph Hash': r.morphHash,
    Institution: r.metadata.institution,
    'Issue Date': r.metadata.issueDate,
    'Certificate Type': r.metadata.certificateType,
    Language: r.metadata.language,
    'QR Data': r.qrData,
    'Layout Score': r.shapeAnalysis.layoutScore,
    'Seal Position': r.shapeAnalysis.sealPosition,
    'Text Alignment': r.shapeAnalysis.textAlignment,
    'Logo Integrity': r.shapeAnalysis.logoIntegrity,
    'Suspicious Zones': r.suspiciousZones.length,
    'Explanation Count': r.explanations.length,
    Timestamp: r.timestamp,
    'Forensic Verdict': r.forensicAnalysis?.verdict ?? '',
    'Forensic Score': r.forensicAnalysis?.authenticity_score ?? '',
    'Compliance Score': r.complianceResult?.overall_compliance_score ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'VeriDoc Results');
  XLSX.writeFile(wb, 'veridoc_results.xlsx');
}

// ─── Print-optimized Report ───────────────────────────────────
export function printReport(result: ValidationResult): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const statusColor = {
    authentic: '#10b981',
    suspicious: '#f59e0b',
    fake: '#ef4444',
  }[result.status];

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>VeriDoc AI — Forensic Report</title>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 32px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 800; color: #1e3a5f; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 700; color: #334155; margin: 20px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
    p { font-size: 13px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; color: white; background: ${statusColor}; margin-bottom: 16px; }
    .score { font-size: 48px; font-weight: 900; color: ${statusColor}; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
    .value { font-size: 13px; font-weight: 600; color: #1e293b; word-break: break-all; }
    .zone { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 10px; margin: 6px 0; }
    .fingerprint { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin: 8px 0; }
    .verdict { font-size: 16px; font-weight: 700; color: ${statusColor}; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>VeriDoc AI — Forensic Analysis Report</h1>
  <p style="color:#64748b;font-size:12px;margin-bottom:16px;">Generated ${new Date().toLocaleString()}</p>

  <!-- Section 1: Identity -->
  <div class="badge">${result.status.toUpperCase()}</div>
  <div class="score">${result.forgeryScore}%</div>
  <p style="color:#64748b;font-size:12px;margin-bottom:20px;">Authenticity Score</p>

  <!-- Section 2: Metadata -->
  <h2>Document Metadata</h2>
  <div class="grid">
    <div class="box"><div class="label">Filename</div><div class="value">${escapeHtml(result.fileName)}</div></div>
    <div class="box"><div class="label">Institution</div><div class="value">${escapeHtml(result.metadata.institution)}</div></div>
    <div class="box"><div class="label">Issue Date</div><div class="value">${escapeHtml(result.metadata.issueDate)}</div></div>
    <div class="box"><div class="label">Certificate Type</div><div class="value">${escapeHtml(result.metadata.certificateType)}</div></div>
    <div class="box"><div class="label">Language</div><div class="value">${escapeHtml(result.metadata.language)}</div></div>
    <div class="box"><div class="label">Verification Method</div><div class="value">${escapeHtml(result.metadata.verificationMethod)}</div></div>
  </div>

  <!-- Section 3: Morphological Fingerprint -->
  <h2>Morphological Fingerprint</h2>
  <div class="fingerprint">${escapeHtml(result.morphHash)}</div>

  <!-- Section 4: Shape Analysis -->
  <h2>Shape Analysis</h2>
  <div class="grid">
    <div class="box"><div class="label">Layout Score</div><div class="value">${result.shapeAnalysis.layoutScore}%</div></div>
    <div class="box"><div class="label">Seal Position</div><div class="value">${escapeHtml(result.shapeAnalysis.sealPosition)}</div></div>
    <div class="box"><div class="label">Text Alignment</div><div class="value">${escapeHtml(result.shapeAnalysis.textAlignment)}</div></div>
    <div class="box"><div class="label">Logo Integrity</div><div class="value">${escapeHtml(result.shapeAnalysis.logoIntegrity)}</div></div>
  </div>

  <!-- Section 5: Suspicious Zones -->
  <h2>Suspicious Zones (${result.suspiciousZones.length})</h2>
  ${result.suspiciousZones.map((z) => `
    <div class="zone">
      <div class="label">${escapeHtml(z.area)} — Confidence: ${z.confidence}%</div>
      <div class="value">${escapeHtml(z.reason)}</div>
    </div>
  `).join('') || '<p>No suspicious zones detected.</p>'}

  <!-- Section 6: Forensic Text Analysis -->
  ${result.forensicAnalysis ? `
  <h2>AI Text Forensics</h2>
  <div class="verdict">${escapeHtml(result.forensicAnalysis.verdict)}</div>
  <div class="grid" style="margin-top:12px;">
    <div class="box"><div class="label">Authenticity</div><div class="value">${result.forensicAnalysis.authenticity_score}/100</div></div>
    <div class="box"><div class="label">Tampering Risk</div><div class="value">${result.forensicAnalysis.tampering_risk.toUpperCase()}</div></div>
    <div class="box"><div class="label">AI Generated</div><div class="value">${result.forensicAnalysis.ai_generated_likelihood.toUpperCase()}</div></div>
  </div>
  <ul style="margin:8px 0 0 16px;">
    ${result.forensicAnalysis.key_reasons.map((r) => `<li style="font-size:13px;margin:4px 0;">${escapeHtml(r)}</li>`).join('')}
  </ul>
  ` : ''}

  <!-- Section 7: QR Code -->
  <h2>QR Code</h2>
  <p>${result.qrData ? `<a href="${escapeHtml(result.qrData)}">${escapeHtml(result.qrData)}</a>` : 'No QR code detected'}</p>

  <p style="margin-top:32px;font-size:11px;color:#94a3b8;text-align:center;">
    Report ID: ${escapeHtml(result.id)} | VeriDoc AI v2.0 | ${new Date().toLocaleDateString()}
  </p>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
