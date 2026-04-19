// ============================================================
// Chat Page — PART 12
// Full LLM chat interface: Groq/DeepSeek/Tavily
// Suggested questions, web search indicator, model selector
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Upload } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import ModelSelector from '../components/chat/ModelSelector';
import MessageBubble from '../components/chat/MessageBubble';
import SuggestedQuestions from '../components/chat/SuggestedQuestions';
import WebSearchIndicator from '../components/chat/WebSearchIndicator';
import MiniPdfPlayer from '../components/upload/MiniPdfPlayer';
import type { ChatMessage } from '../shared/types';

const SESSION_ID = `session-${Date.now()}`;

export default function Chat() {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pdfLoadingLocal, setPdfLoadingLocal] = useState(false);

  const {
    chatHistory, appendChatMessage, clearChat,
    isSearching, isChatLoading, setChatLoading, setSearching,
    activeModel, suggestedQuestions, setSuggestedQuestions,
    pdfUrl, pdfExtractedText, setPdfUrl, setPdfExtractedText,
    isMiniPlayerOpen, closeMiniPlayer,
  } = useAppStore();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSearching, isChatLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    appendChatMessage(userMsg);
    setInput('');
    setChatLoading(true);

    try {
      const response = await api.sendChatMessage({
        user_query: trimmed,
        model: activeModel,
        history: chatHistory.slice(-10),
        pdf_text: pdfExtractedText || undefined,
        session_id: SESSION_ID,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        source: response.used_web_search ? 'tavily' : activeModel === 'deepseek-chat' ? 'deepseek' : 'groq',
      };
      appendChatMessage(assistantMsg);
    } catch {
      // Offline fallback: direct Groq API
      try {
        const messages = [
          { role: 'system', content: 'You are VeriDoc AI, an expert document forensics assistant.' },
          ...chatHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: trimmed },
        ];
        const text = await api.groqChat(messages, activeModel === 'deepseek-chat' ? 'llama3-70b-8192' : activeModel);
        appendChatMessage({
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: text,
          timestamp: new Date().toISOString(),
          source: 'groq',
        });
      } catch (fallbackErr) {
        appendChatMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach AI service. Please check your API keys in .env and try again.',
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuestionClick = async (question: string) => {
    appendChatMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    });

    setSearching(true);
    try {
      const result = await api.tavilySearch(question);
      appendChatMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.answer || result.context_block || 'No results found.',
        timestamp: new Date().toISOString(),
        source: 'tavily',
        sources: (result.sources || []).map((s: any) => ({ url: s.url, title: s.title || s.url })),
      });
    } catch {
      appendChatMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Tavily search failed. Ensure VITE_TAVILY_API_KEY is set.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSearching(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPdfUrl(objectUrl);
    setPdfLoadingLocal(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      setPdfExtractedText(fullText);

      try {
        const res = await api.readPdfAndGetQuestions(file);
        setSuggestedQuestions(res.suggested_questions || []);
      } catch {
        setSuggestedQuestions([
          'What institution issued this document?',
          'Are the dates on this document valid?',
          'Is the issuing authority accredited?',
          'What qualifications does this document represent?',
          'Are there known forgery patterns for this document type?',
          'How can this document\'s authenticity be verified?',
        ]);
      }

      appendChatMessage({
        id: `system-${Date.now()}`,
        role: 'system',
        content: `📄 PDF loaded: "${file.name}" (${doc.numPages} page${doc.numPages !== 1 ? 's' : ''}). Ask me anything about this document.`,
        timestamp: new Date().toISOString(),
        source: 'pdf',
      });
    } finally {
      setPdfLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-white/5 bg-[#0A0A0A] p-5 gap-5">
        <div>
          <h2 className="text-lg font-bold text-white mb-1">VeriDoc Chat</h2>
          <p className="text-xs text-slate-500">AI-powered document analysis</p>
        </div>

        <ModelSelector />

        {/* PDF Upload */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">
            Load PDF
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
            aria-label="Upload PDF for analysis"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={pdfLoadingLocal}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-2.5 rounded-xl text-sm font-bold
              border border-white/10
              bg-[#111111]
              hover:bg-white/5
              hover:border-white/20
              text-slate-300
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-app-accent
              disabled:opacity-50
            "
            aria-label="Upload PDF document"
          >
            <Upload className="w-4 h-4" />
            {pdfLoadingLocal ? 'Reading PDF…' : pdfUrl ? 'Replace PDF' : 'Upload PDF'}
          </button>
        </div>

        {/* Chat Controls */}
        <div className="mt-auto">
          <button
            onClick={() => { clearChat(); setSuggestedQuestions([]); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            aria-label="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {chatHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-black border border-white/10 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                🔍
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">VeriDoc AI Chat</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Upload a PDF or ask anything about document forensics
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {chatHistory.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <MessageBubble message={msg} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicators */}
          {(isSearching || isChatLoading) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {isSearching && <WebSearchIndicator />}
              {isChatLoading && !isSearching && (
                <div className="flex justify-start mb-4">
                  <div className="bg-[#111111] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* Suggested Questions */}
        {suggestedQuestions.length > 0 && !isSearching && (
          <div className="px-4 border-t border-white/5 py-3 bg-[#0A0A0A]">
            <SuggestedQuestions
              questions={suggestedQuestions}
              onQuestionClick={handleQuestionClick}
              isLoading={false}
            />
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-white/5 bg-[#0A0A0A]">
          <div className="flex gap-3 items-end">
            <textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about document forensics, or type a question…"
              rows={1}
              className="
                flex-1 resize-none rounded-xl border border-white/10
                bg-[#111111]
                px-4 py-3 text-sm text-white
                placeholder:text-slate-500
                focus:outline-none focus:ring-2 focus:ring-app-accent
                max-h-32 overflow-y-auto
              "
              aria-label="Chat message input"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isChatLoading}
              id="send-message-button"
              className="
                w-11 h-11 rounded-xl flex items-center justify-center
                bg-app-accent hover:brightness-110
                disabled:opacity-40 disabled:cursor-not-allowed
                text-black transition-all duration-200 shadow-[0_0_15px_rgba(34,197,94,0.3)]
                focus:outline-none focus:ring-2 focus:ring-app-accent
              "
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {/* Mini PDF Player */}
      {isMiniPlayerOpen && pdfUrl && (
        <MiniPdfPlayer pdfUrl={pdfUrl} onClose={closeMiniPlayer} />
      )}
    </div>
  );
}
