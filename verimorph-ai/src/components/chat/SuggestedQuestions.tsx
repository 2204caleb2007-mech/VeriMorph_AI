// ============================================================
// PART 12 — Suggested Questions Component
// Renders Groq-generated questions as clickable chips
// Clicking fires Tavily web search
// ============================================================
interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
  isLoading: boolean;
}

const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onQuestionClick,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex gap-2 flex-wrap mt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-9 w-48 rounded-full bg-[#111111] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!questions.length) return null;

  return (
    <div className="mt-4">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-semibold uppercase tracking-widest flex items-center gap-1">
        <span>🔍</span> Related questions — powered by Tavily
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            id={`suggested-question-${i}`}
            onClick={() => onQuestionClick(q)}
            className="
              px-4 py-1.5 text-xs rounded-full border
              border-white/10
              bg-[#111111]
              text-slate-300
              hover:bg-white/5
              hover:text-white
              hover:border-white/20
              transition-all duration-200 ease-in-out
              cursor-pointer font-medium
              focus:outline-none focus:ring-2 focus:ring-app-accent
              active:scale-95
            "
            aria-label={`Search: ${q}`}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
