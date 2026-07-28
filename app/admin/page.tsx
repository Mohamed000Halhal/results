'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Users, CheckCircle, XCircle, FileSpreadsheet, Calendar, HardDrive, ArrowLeft, ArrowRight, Loader2, Table } from 'lucide-react';
import Link from 'next/link';

interface StatsData {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passedPercentage: number;
  lastImportDate: string | null;
  lastImportedFile: string | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Stats error:', err);
        setErrorMsg('حدث خطأ في تحميل الإحصائيات');
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-x-hidden">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">نظرة عامة على النتائج</h1>
            <p className="text-xs text-slate-400 mt-1">
              متابعة البيانات والإحصائيات الخاصة بنتائج الطلاب المُدخلة
            </p>
          </div>

          <Link
            href="/admin/import"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-brand-600/20 transition-all self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>رفع إكسل جديد</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
            {errorMsg}
          </div>
        ) : stats ? (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Students */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">إجمالي الطلاب</span>
                  <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-white font-mono">
                  {stats.totalStudents.toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-slate-500">طالب في قاعدة البيانات</p>
              </div>

              {/* Passed Students */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">الطلاب الناجحون</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-emerald-400 font-mono">
                  {stats.passedStudents.toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-emerald-500 font-semibold">
                  نسبة النجاح: {stats.passedPercentage}%
                </p>
              </div>

              {/* Failed / 2nd Session Students */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">الراسبون / دور ثاني</span>
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-rose-400 font-mono">
                  {stats.failedStudents.toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-rose-500 font-semibold">
                  نسبة الرسوب: {stats.totalStudents > 0 ? (100 - stats.passedPercentage).toFixed(1) : 0}%
                </p>
              </div>

              {/* Last Import Meta */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">آخر استيراد</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-200 truncate" title={stats.lastImportedFile || 'لا يوجد'}>
                  {stats.lastImportedFile || 'لم يتم رفع ملف بعد'}
                </p>
                <p className="text-xs text-slate-500">
                  {stats.lastImportDate
                    ? new Date(stats.lastImportDate).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <Link
                href="/admin/import"
                className="group bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-6 transition-all flex items-start justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">
                    رفع واستيراد ملف إكسل
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                    قراءة واختبار صحة بيانات ملف Excel الجديد وحفظ النتائج فورياً في قاعدة البيانات
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-brand-400 group-hover:-translate-x-1 transition-all rotate-180" />
              </Link>

              <Link
                href="/admin/results"
                className="group bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-6 transition-all flex items-start justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Table className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    سجل نتائج الطلاب والحذف
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                    استعراض الجدول الكامل للنتائج المخزنة، البحث بين الطلاب، وحذف السجلات المحددة
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-1 transition-all rotate-180" />
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
