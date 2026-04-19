// ============================================================
// Message Bubble — PART 12
// User + AI message bubbles with timestamps and source badges
// ============================================================
import type { ChatMessage } from '../../shared/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const sourceColors: Record<string, string> = {
  groq: 'bg-app-accent-subtle text-app-accent border border-app-accent/10',
  tavily: 'bg-white/5 text-slate-400 border border-white/5',
  deepseek: 'bg-white/5 text-slate-400 border border-white/5',
  pdf: 'bg-white/5 text-slate-400 border border-white/5',
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 shadow-soft
          ${isUser
            ? 'bg-app-accent text-black font-medium rounded-tr-sm'
            : 'bg-[#111111] border border-white/5 text-white rounded-tl-sm'
          }
        `}
      >
        {/* Source badge */}
        {!isUser && message.source && (
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
              sourceColors[message.source] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-500'
            }`}
          >
            {message.source === 'tavily' ? '🌐 Tavily' : 
             message.source === 'groq' ? '⚡ Groq' :
             message.source === 'deepseek' ? '🤖 DeepSeek' : '📄 PDF'}
          </span>
        )}

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">Sources:</p>
            <div className="flex flex-col gap-1">
              {message.sources.slice(0, 3).map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-app-accent hover:brightness-110 hover:underline truncate block transition-all"
                >
                  {src.title || src.url}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] mt-1 ${isUser ? 'text-black/40' : 'text-slate-500'}`}>
          {time}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
