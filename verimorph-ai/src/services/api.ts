// ============================================================
// API Service — PART 9 / PART 14
// All backend endpoints with retry logic, offline fallback
// Keys loaded from import.meta.env.VITE_*
// ============================================================
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || '';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// Retry interceptor
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;
    if (!config || config.__retryCount >= 3) return Promise.reject(error);
    config.__retryCount = (config.__retryCount || 0) + 1;
    await new Promise((r) => setTimeout(r, config.__retryCount * 1000));
    return client(config);
  }
);

const api = {
  // ─── Forensic Upload ──────────────────────────────────────
  async uploadDocument(file: File, language: string): Promise<{ jobId: string; documentId: string }> {
    const form = new FormData();
    form.append('file', file);
    form.append('language', language);
    const res = await client.post('/api/upload', form);
    return res.data;
  },

  async uploadBatch(files: File[], language: string): Promise<{ jobId: string; documentId: string }[]> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    form.append('language', language);
    const res = await client.post('/api/upload/batch', form);
    return res.data;
  },

  async pollJobStatus(jobId: string): Promise<any> {
    const res = await client.get(`/api/result/${jobId}`);
    return res.data;
  },

  async getResultDetail(resultId: string): Promise<any> {
    const res = await client.get(`/api/result/detail/${resultId}`);
    return res.data;
  },

  async getHistory(page = 1, limit = 20): Promise<any> {
    const res = await client.get('/api/history', { params: { page, limit } });
    return res.data;
  },

  async deleteResult(resultId: string): Promise<void> {
    await client.delete(`/api/result/${resultId}`);
  },

  async markAsFake(resultId: string): Promise<void> {
    await client.patch(`/api/result/${resultId}/mark-fake`);
  },

  async getHeatmap(resultId: string): Promise<Blob> {
    const res = await client.get(`/api/heatmap/${resultId}`, { responseType: 'blob' });
    return res.data;
  },

  async exportExcel(): Promise<Blob> {
    const res = await client.get('/api/export/excel', { responseType: 'blob' });
    return res.data;
  },

  async exportReport(resultId: string): Promise<Blob> {
    const res = await client.get(`/api/export/report/${resultId}`, { responseType: 'blob' });
    return res.data;
  },

  // ─── Chat & LLM ───────────────────────────────────────────
  async sendChatMessage(payload: {
    user_query: string;
    model: string;
    history: any[];
    pdf_text?: string;
    session_id: string;
  }): Promise<{ response: string; used_web_search: boolean }> {
    const res = await client.post('/api/chat/message', payload);
    return res.data;
  },

  async readPdfAndGetQuestions(file: File): Promise<{
    extracted_text: string;
    chunks: string[];
    suggested_questions: string[];
  }> {
    const form = new FormData();
    form.append('file', file);
    const res = await client.post('/api/chat/read-pdf', form);
    return res.data;
  },

  async tavilySearch(query: string): Promise<{
    query: string;
    answer: string;
    sources: Array<{ url: string; title: string; content: string }>;
    context_block: string;
  }> {
    // Try backend first
    try {
      const res = await client.post('/api/chat/tavily-search', { query });
      return res.data;
    } catch {
      // Fallback: direct Tavily API call if key available
      if (TAVILY_API_KEY) {
        const res = await axios.post(
          'https://api.tavily.com/search',
          {
            api_key: TAVILY_API_KEY,
            query,
            search_depth: 'advanced',
            max_results: 5,
            include_answer: true,
          }
        );
        return {
          query,
          answer: res.data.answer || '',
          sources: res.data.results || [],
          context_block: res.data.answer || '',
        };
      }
      throw new Error('Tavily search unavailable');
    }
  },

  async getChatHistory(sessionId: string): Promise<any[]> {
    const res = await client.get('/api/chat/history', { params: { session_id: sessionId } });
    return res.data;
  },

  async clearChatHistory(sessionId: string): Promise<void> {
    await client.delete('/api/chat/history', { params: { session_id: sessionId } });
  },

  // ─── Forensic Analysis ───────────────────────────────────
  async analyzeTextForensics(document_text: string, metadata: Record<string, unknown>): Promise<any> {
    const res = await client.post('/api/forensics/text', { document_text, metadata });
    return res.data;
  },

  async analyzeImageForensics(imageFile: File): Promise<{ verdict: string; confidence: number; heatmap_url: string }> {
    const form = new FormData();
    form.append('file', imageFile);
    const res = await client.post('/analyze-image', form);
    return res.data;
  },

  async validateCompliance(target_text: string, reference_text: string): Promise<any> {
    const res = await client.post('/api/forensics/compliance', { target_text, reference_text });
    return res.data;
  },

  // ─── Direct Groq (frontend fallback) ─────────────────────
  async groqChat(messages: Array<{ role: string; content: string }>, model: string): Promise<string> {
    if (!GROQ_API_KEY) throw new Error('Groq API key not set');
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model, messages, temperature: 0.3, max_tokens: 2048 },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return res.data.choices[0].message.content;
  },

  // ─── Health ───────────────────────────────────────────────
  async getHealth(): Promise<Record<string, string>> {
    const res = await client.get('/api/health');
    return res.data;
  },
};

export default api;
