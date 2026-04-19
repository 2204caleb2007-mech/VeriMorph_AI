import { useParams, useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, ArrowLeft, Shield } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { exportToExcel } from '../services/export';

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const result = useAppStore(s => s.validationResults.find(r => r.id === id));

  if (!result) return <div>Result not found</div>;

  const getStatusColor = (s: string) =>
    s === 'authentic' ? 'text-app-accent border-app-accent' :
    s === 'suspicious' ? 'text-yellow-600 border-yellow-600' : 'text-red-600 border-red-600';

  return (
    <div className="min-h-screen bg-black py-8 text-black print:bg-white print:py-0">
      {/* Controls (hidden in print) */}
      <div className="max-w-[21cm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Analysis
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-app-accent text-black rounded-lg hover:brightness-110 transition font-bold">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={() => exportToExcel([result])} className="flex items-center gap-2 px-4 py-2 bg-[#111111] border border-white/10 text-white rounded-lg hover:bg-white/5 transition font-bold">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* A4 Page */}
      <div className="w-[21cm] min-h-[29.7cm] mx-auto bg-white shadow-2xl print:shadow-none p-12 text-sm">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-8">
          <div className="flex gap-3 items-center">
            <Shield className="w-10 h-10 text-app-accent" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">VeriMorph AI</h1>
              <p className="text-slate-500 uppercase tracking-widest text-xs">Official Forgery Analysis Report</p>
            </div>
          </div>
          <div className="text-right text-slate-500 space-y-1">
            <p>Report ID: <span className="font-mono text-slate-800">{result.id.slice(-8)}</span></p>
            <p>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Status Badge Large */}
        <div className="flex justify-center mb-10">
          <div className={`px-10 py-3 border-4 font-black text-3xl uppercase tracking-widest rounded-xl ${getStatusColor(result.status)}`}>
            {result.status}
          </div>
        </div>

        {/* Summary Table */}
        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-10">
          {[
            ['File Name', result.fileName],
            ['Institution', result.metadata.institution],
            ['Issue Date', result.metadata.issueDate],
            ['Document Type', result.metadata.certificateType],
            ['Method', result.metadata.verificationMethod],
            ['Target Language', result.metadata.language.toUpperCase()],
          ].map(([label, val]) => (
            <div key={label} className="border-b border-slate-100 pb-2">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
              <span className="font-medium text-slate-800">{val}</span>
            </div>
          ))}
        </div>

        {/* Score */}
        <div className="mb-10">
          <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">Confidence Score</h3>
          <div className="flex items-center gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-5xl font-black text-slate-800">{result.forgeryScore}<span className="text-2xl text-slate-400 font-medium">/100</span></div>
            <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${result.forgeryScore >= 85 ? 'bg-app-accent' : result.forgeryScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${result.forgeryScore}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4 text-center">
            <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500 mb-1">Layout</div><div className="font-bold">{result.shapeAnalysis.layoutScore}%</div></div>
            <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500 mb-1">Seal</div><div className="font-bold">{result.shapeAnalysis.sealPosition}</div></div>
            <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500 mb-1">Text Alignment</div><div className="font-bold">{result.shapeAnalysis.textAlignment}</div></div>
            <div className="p-3 bg-slate-50 rounded-lg"><div className="text-xs text-slate-500 mb-1">Logo</div><div className="font-bold">{result.shapeAnalysis.logoIntegrity}</div></div>
          </div>
        </div>

        {/* Explanations */}
        <div className="mb-10">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Detected Anomalies</h3>
          {result.explanations.length === 0 ? (
            <p className="italic text-slate-500">No anomalies detected. The document structure and content are consistent with an authentic document.</p>
          ) : (
            <ol className="list-decimal pl-5 space-y-3">
              {result.explanations.map((exp, i) => (
                <li key={i} className="pl-2">
                  <span className="font-semibold">{exp.type.replace('_', ' ').toUpperCase()}:</span> {exp.description}
                  <span className="ml-2 text-xs px-2 py-0.5 bg-slate-100 rounded-full font-bold text-slate-600">SEVERITY: {exp.severity.toUpperCase()}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Hash & QR */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div>
            <h3 className="font-bold text-slate-800 mb-2 border-b pb-2">Morphological Hash</h3>
            <div className="font-mono text-xs p-3 bg-slate-50 rounded-lg break-all border border-slate-100">{result.morphHash}</div>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 mb-2 border-b pb-2">QR Code Data</h3>
            <div className="font-mono text-xs p-3 bg-slate-50 rounded-lg break-all border border-slate-100 min-h-[42px]">
              {result.qrData || <span className="italic text-slate-400">None detected</span>}
            </div>
          </div>
        </div>

        {/* OCR Snippet (cut off if too long for print format) */}
        <div>
          <h3 className="font-bold text-slate-800 mb-2 border-b pb-2">Extracted Text Sample</h3>
          <div className="font-mono text-[10px] leading-relaxed p-4 bg-slate-50 rounded-lg text-slate-600 line-clamp-[12] border border-slate-100 break-words">
            {result.ocrText || 'No text extracted.'}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center text-xs text-slate-400 border-t pt-4">
          Report generated by VeriMorph AI · Official use only
        </div>
      </div>
    </div>
  );
}
