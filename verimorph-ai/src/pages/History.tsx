import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileSpreadsheet, FolderSearch } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import FileCard from '../components/common/FileCard';
import { exportToExcel } from '../services/export';
import type {} from '../shared/types';

type Tab = 'all' | 'authentic' | 'suspicious' | 'fake';
type Sort = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc';

export default function History() {
  const { validationResults, setActiveResult } = useAppStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<Sort>('date_desc');

  const filtered = useMemo(() => {
    let res = validationResults;
    if (tab !== 'all') res = res.filter(r => r.status === tab);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(r => r.fileName.toLowerCase().includes(q) || r.metadata.institution.toLowerCase().includes(q));
    }
    return res.sort((a, b) => {
      if (sort === 'date_desc') return b.timestamp.localeCompare(a.timestamp);
      if (sort === 'date_asc') return a.timestamp.localeCompare(b.timestamp);
      if (sort === 'score_desc') return b.forgeryScore - a.forgeryScore;
      if (sort === 'score_asc') return a.forgeryScore - b.forgeryScore;
      return 0;
    });
  }, [validationResults, search, tab, sort]);

  const handleExcelExport = () => {
    if (validationResults.length > 0) exportToExcel(validationResults);
  };

  const handleRowView = (id: string) => {
    setActiveResult(id);
    navigate(`/analysis/${id}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-black pt-8 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Validation History</h1>
            <p className="text-slate-400 text-sm">Review past document analyses, scores, and explanations.</p>
          </div>
          <button
            onClick={handleExcelExport}
            disabled={validationResults.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-app-accent-subtle text-app-accent border border-app-accent/20 rounded-xl hover:bg-app-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export All to Excel
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search filename or institution..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111111] border border-white/5 text-white focus:outline-none focus:border-app-accent transition-colors"
            />
          </div>

          <div className="flex gap-2 p-1 bg-[#111111] rounded-xl border border-white/5 overflow-x-auto">
            {(['all', 'authentic', 'suspicious', 'fake'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all
                  ${tab === t ? 'bg-app-accent-subtle text-app-accent border border-app-accent/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                {t}
              </button>
            ))}
          </div>

          <select
            value={sort}
            onChange={e => setSort(e.target.value as Sort)}
            className="px-4 py-2.5 rounded-xl bg-[#111111] border border-white/5 text-slate-300 text-sm focus:outline-none focus:border-app-accent appearance-none cursor-pointer"
          >
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="score_desc">Highest score</option>
            <option value="score_asc">Lowest score</option>
          </select>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <FolderSearch className="w-16 h-16 text-white/5 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No results found</h3>
              <p className="text-slate-500">Try adjusting your search or filters, or upload a new document.</p>
            </div>
          ) : (
            filtered.map((r) => (
              <FileCard
                key={r.id}
                result={r}
                onView={() => handleRowView(r.id)}
                onDownload={() => navigate(`/report/${r.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
