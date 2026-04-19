import type {} from '../../shared/types';

interface Props { ocrText: string; ocrWords: ValidationResult['ocrWords'] }

export default function OCRTextViewer({ ocrText, ocrWords }: Props) {
  const suspSet = new Set(ocrWords.filter(w => w.suspicious).map(w => w.text.toLowerCase()));
  const positiveSet = new Set(
    ocrWords.filter(w => !w.suspicious && w.text.length > 3).map(w => w.text.toLowerCase())
  );

  if (!ocrText) {
    return (
      <div className="text-slate-500 text-sm italic p-3 bg-black border border-white/5 rounded-xl">
        No OCR text extracted from this document.
      </div>
    );
  }

  const words = ocrText.split(/(\s+)/);
  return (
    <div className="max-h-48 overflow-y-auto scrollbar-thin bg-black rounded-xl p-4 font-mono text-xs leading-relaxed border border-white/10">
      {words.map((word, i) => {
        const lower = word.trim().toLowerCase();
        if (suspSet.has(lower)) {
          return (
            <span key={i} title={`Suspicious keyword · confidence flagged`}
              className="bg-red-500/20 text-red-300 rounded px-0.5 cursor-help border-b border-red-500/40">
              {word}
            </span>
          );
        }
        if (positiveSet.has(lower)) {
          return (
            <span key={i} className="bg-app-accent-subtle text-app-accent rounded px-0.5">{word}</span>
          );
        }
        return <span key={i} className="text-slate-400">{word}</span>;
      })}
    </div>
  );
}
