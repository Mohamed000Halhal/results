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
    <div className="min-h-screen bg-[#fbf8f3] text-stone-900 flex flex-col md:flex-row selection:bg-brand-600 selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/90 pb-6">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">جدول نتائج الطلاب</h1>
            <p className="text-xs font-bold text-stone-500 mt-1">
              إجمالي النتائج المسجلة: <strong className="text-brand-900 font-mono">{totalRecords.toLocaleString('ar-EG')}</strong> طالب
            </p>
          </div>

          <button
            onClick={() => setShowWipeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold rounded-2xl transition-all shadow-sm self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>مسح جميع النتائج من قاعدة البيانات</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="تصفية حسب الاسم أو رقم الجلوس..."
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-amber-200 rounded-2xl text-stone-900 placeholder:text-stone-400 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 shadow-sm transition-all"
            />
          </div>

          <button
            onClick={fetchResults}
            className="p-2.5 bg-white hover:bg-amber-50 text-stone-700 border border-amber-200 rounded-2xl transition-colors shadow-sm self-end sm:self-auto"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>

        {/* Results Table Card */}
        <div className="bg-white/95 border border-amber-200/90 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#f5ebd9] text-stone-800 text-xs uppercase font-extrabold border-b border-amber-200">
                <tr>
                  <th className="p-4 font-bold">اسم الطالب</th>
                  <th className="p-4 font-bold">رقم الجلوس</th>
                  <th className="p-4 font-bold">النتيجة</th>
                  <th className="p-4 font-bold">النسبة المئوية</th>
                  <th className="p-4 font-bold">الدرجة المكتسبة</th>
                  <th className="p-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-stone-500">
                      <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto mb-2" />
                      <span className="text-xs font-bold">جاري تحميل النتائج...</span>
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-stone-500 font-bold text-xs">
                      لا توجد نتائج تطابق استعلام البحث الحالي
                    </td>
                  </tr>
                ) : (
                  results.map((item) => {
                    const isPassed =
                      item.result.includes('ناجح') || item.percentage >= 50;

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/70 transition-colors">
                        <td className="p-4 font-bold text-stone-900">{item.name}</td>
                        <td className="p-4 font-mono font-bold text-amber-900">{item.seatNumber}</td>
                        <td className="p-4 font-bold">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isPassed
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {item.result}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-brand-900 font-mono">{item.percentage}%</td>
                        <td className="p-4 font-bold text-stone-700 font-mono">{(Math.round(item.percentage * 3.2 * 10) / 10)} من 320</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="حذف الطالب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#faf6f0] border-t border-amber-200/80 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500">
              الصفحة {page} من {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="p-2 bg-white border border-amber-200 rounded-xl text-stone-700 hover:bg-amber-50 disabled:opacity-40 font-bold transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="p-2 bg-white border border-amber-200 rounded-xl text-stone-700 hover:bg-amber-50 disabled:opacity-40 font-bold transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Single Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-amber-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-3 bg-rose-100 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-stone-900">تأكيد حذف الطالب</h3>
              </div>

              <p className="text-xs text-stone-600 font-bold leading-relaxed">
                هل أنت تأكد من إزالة هذا الطالب من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleDeleteSingle(deleteId)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>تأكيد الحذف</span>
                </button>

                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 bg-amber-100 hover:bg-amber-200 text-stone-800 text-xs font-bold rounded-2xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wipe All Database Confirmation Modal */}
        {showWipeModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-amber-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="p-3 bg-rose-100 rounded-2xl">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-stone-900">تحذير: مسح السجلات بالكامـل</h3>
                </div>
                <button
                  onClick={() => setShowWipeModal(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-600 font-bold leading-relaxed">
                أنت على وشك القيام بمسح <strong className="text-rose-600">جميع نتائج الطلاب ({totalRecords})</strong> نهائياً من قاعدة البيانات.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleWipeAll}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>مسح الكل وإعادة التهيئة</span>
                </button>

                <button
                  onClick={() => setShowWipeModal(false)}
                  className="flex-1 py-3 bg-amber-100 hover:bg-amber-200 text-stone-800 text-xs font-bold rounded-2xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
