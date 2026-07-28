'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Table, Search, Trash2, ChevronRight, ChevronLeft, Loader2, AlertTriangle, RefreshCw, X } from 'lucide-react';

interface StudentRecord {
  id: string;
  name: string;
  seatNumber: string;
  result: string;
  percentage: number;
  createdAt: string;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<StudentRecord[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/results?q=${encodeURIComponent(query)}&page=${page}&limit=25`);
      const data = await res.json();
      setResults(data.results || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch (err) {
      console.error('Fetch results error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [page, query]);

  const handleDeleteSingle = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/results?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteId(null);
        fetchResults();
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWipeAll = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/delete-all', { method: 'POST' });
      if (res.ok) {
        setShowWipeModal(false);
        fetchResults();
      }
    } catch (err) {
      console.error('Wipe error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">جدول نتائج الطلاب</h1>
            <p className="text-xs text-slate-400 mt-1">
              إجمالي النتائج المسجلة: <strong className="text-white font-mono">{totalRecords}</strong> طالب
            </p>
          </div>

          <button
            onClick={() => setShowWipeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>مسح جميع النتائج من قاعدة البيانات</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="بحث داخل السجل برقم الجلوس أو اسم الطالب..."
            className="w-full bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white text-xs">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950/80 text-xs text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">اسم الطالب</th>
                  <th className="p-4">رقم الجلوس</th>
                  <th className="p-4">النتيجة</th>
                  <th className="p-4">النسبة المئوية</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 text-brand-500 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      لا توجد نتائج مطابقة في قاعدة البيانات
                    </td>
                  </tr>
                ) : (
                  results.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold text-white">{item.name}</td>
                      <td className="p-4 font-mono text-amber-300">{item.seatNumber}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                            item.result.includes('ناجح') || item.percentage >= 50
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.result || 'ناجح'}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-brand-300">{item.percentage}%</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteSingle(item.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="حذف الطالب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>الصفحة {page} من {totalPages}</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wipe Modal */}
        {showWipeModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">تأكيد مسح قاعدة البيانات بالكامل؟</h3>
                <p className="text-xs text-slate-400">
                  سيتم حذف جميع سجلات الطلاب النهائية. لا يمكن التراجع عن هذا الإجراء!
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowWipeModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleWipeAll}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl"
                >
                  {isDeleting ? 'جاري المسح...' : 'نعم، مسح البيانات'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
