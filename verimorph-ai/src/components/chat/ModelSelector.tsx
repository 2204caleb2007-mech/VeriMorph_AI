// ============================================================
// Model Selector — PART 12
// Groq llama3, mixtral, DeepSeek options
// ============================================================
import useAppStore from '../../store/useAppStore';

const MODELS = [
  { label: 'Llama 3 (70B) — Groq', value: 'llama3-70b-8192' },
  { label: 'Mixtral (8×7B) — Groq', value: 'mixtral-8x7b-32768' },
  { label: 'DeepSeek Chat', value: 'deepseek-chat' },
] as const;

const ModelSelector: React.FC = () => {
  const activeModel = useAppStore((s) => s.activeModel);
  const setActiveModel = useAppStore((s) => s.setActiveModel);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
        Model
      </label>
      <select
        id="model-selector"
        value={activeModel}
        onChange={(e) => setActiveModel(e.target.value as typeof activeModel)}
        className="
          w-full px-3 py-2.5 rounded-xl text-sm
          bg-[#111111]
          border border-white/10
          text-slate-200
          focus:outline-none focus:ring-2 focus:ring-app-accent
          cursor-pointer transition-all
        "
        aria-label="Select AI model"
      >
        {MODELS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
