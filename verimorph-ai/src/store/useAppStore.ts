// ============================================================
// VeriDoc AI — Zustand Store (PART 8)
// Full implementation — no placeholders
// ============================================================
import { create } from 'zustand';
import type { AppState, Actions, ValidationResult, ChatMessage } from '../shared/types';

const useAppStore = create<AppState & Actions>((set) => ({
  // ─── State ────────────────────────────────────────────────
  validationResults: [],
  isValidating: false,
  offlineMode: false,
  theme: 'dark',
  concurrency: 3,
  selectedLanguage: 'eng',
  activeResultId: null,
  highlightedZoneIndex: null,
  highlightedExplanationIndex: null,

  // Chat & LLM state
  chatHistory: [],
  activeModel: 'llama3-70b-8192',
  isSearching: false,
  isChatLoading: false,
  suggestedQuestions: [],
  pdfUrl: null,
  isMiniPlayerOpen: false,
  isMiniPlayerMinimized: false,
  pdfExtractedText: '',

  // ─── Actions ──────────────────────────────────────────────
  prependResult: (r: ValidationResult) =>
    set((s) => ({ validationResults: [r, ...s.validationResults] })),

  setValidating: (v: boolean) => set({ isValidating: v }),

  toggleOffline: () => set((s) => ({ offlineMode: !s.offlineMode })),

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),

  setConcurrency: (n: number) => set({ concurrency: Math.max(1, Math.min(4, n)) }),

  setLanguage: (lang: string) => set({ selectedLanguage: lang }),

  setActiveResult: (id: string | null) =>
    set({
      activeResultId: id,
      highlightedZoneIndex: null,
      highlightedExplanationIndex: null,
    }),

  setHighlightedZone: (i: number | null) => set({ highlightedZoneIndex: i }),

  setHighlightedExplanation: (i: number | null) => set({ highlightedExplanationIndex: i }),

  markAsFake: (id: string) =>
    set((s) => ({
      validationResults: s.validationResults.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'fake' as const,
              forgeryScore: 0,
              suspiciousZones: [],
              qrData: '',
              explanations: [],
            }
          : r
      ),
    })),

  retryResult: (id: string, newResult: ValidationResult) =>
    set((s) => ({
      validationResults: s.validationResults.map((r) => (r.id === id ? newResult : r)),
    })),

  clearAll: () => set({ validationResults: [] }),

  // ─── Chat Actions ─────────────────────────────────────────
  appendChatMessage: (msg: ChatMessage) =>
    set((s) => ({ chatHistory: [...s.chatHistory, msg] })),

  clearChat: () => set({ chatHistory: [] }),

  setActiveModel: (model) => set({ activeModel: model }),

  setSearching: (v: boolean) => set({ isSearching: v }),

  setChatLoading: (v: boolean) => set({ isChatLoading: v }),

  setSuggestedQuestions: (qs: string[]) => set({ suggestedQuestions: qs }),

  setPdfUrl: (url: string | null) =>
    set({ pdfUrl: url, isMiniPlayerOpen: !!url }),

  setPdfExtractedText: (text: string) => set({ pdfExtractedText: text }),

  openMiniPlayer: () => set({ isMiniPlayerOpen: true }),

  closeMiniPlayer: () => set({ isMiniPlayerOpen: false, pdfUrl: null }),

  toggleMiniPlayerMinimize: () =>
    set((s) => ({ isMiniPlayerMinimized: !s.isMiniPlayerMinimized })),
}));

export default useAppStore;
