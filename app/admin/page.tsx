'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Users, CheckCircle, XCircle, FileSpreadsheet, Calendar, HardDrive, Loader2, Table, Eye, Award } from 'lucide-react';
import Link from 'next/link';

interface StatsData {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passedPercentage: number;
  visitorCount: number;
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
        if (!res.ok || data.error) {
          setErrorMsg(data.error || 'حدث خطأ في تحميل الإحصائيات');
          return;
        }
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
    <div className="min-h-screen bg-[#fbf8f3] text-stone-900 flex flex-col md:flex-row selection:bg-brand-600 selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-x-hidden">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/90 pb-6">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">نظرة عامة على النتائج</h1>
            <p className="text-xs font-bold text-stone-500 mt-1">
              متابعة البيانات والإحصائيات الخاصة بنتائج الطلاب المُدخلة
            </p>
          </div>

          <Link
            href="/admin/import"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-700/20 transition-all self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>رفع إكسل جديد</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-sm font-bold shadow-sm">
            {errorMsg}
          </div>
        ) : stats ? (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Unique Visitors */}
              <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">إجمالي زوار الموقع</span>
                  <div className="p-2.5 bg-amber-100 text-brand-800 rounded-2xl border border-amber-200">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-stone-900 font-mono">
                  {(stats?.visitorCount || 0).toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-stone-500 font-medium">زائر فريد (بدون تكرار)</p>
              </div>

              {/* Total Students */}
              <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">إجمالي الطلاب</span>
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl border border-amber-200">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-amber-900 font-mono">
                  {(stats?.totalStudents || 0).toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-stone-500 font-medium">سجل طالب بالمنظومة</p>
              </div>

              {/* Passed Students */}
              <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">عدد الناجحين</span>
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl border border-emerald-200">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-emerald-800 font-mono">
                  {(stats?.passedStudents || 0).toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-emerald-700 font-bold">
                  نسبة النجاح: {stats?.passedPercentage || 0}%
                </p>
              </div>

              {/* Failed Students */}
              <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">عدد الراسبين / الدور الثاني</span>
                  <div className="p-2.5 bg-rose-100 text-rose-800 rounded-2xl border border-rose-200">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-rose-800 font-mono">
                  {(stats?.failedStudents || 0).toLocaleString('ar-EG')}
                </p>
                <p className="text-xs text-stone-500 font-medium">طالب لم يستوف الشروط</p>
              </div>

              {/* Percentage Overview */}
              <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">نسبة النجاح العامة</span>
                  <div className="p-2.5 bg-brand-100 text-brand-800 rounded-2xl border border-amber-200">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-black text-brand-900 font-mono">
                  {stats?.passedPercentage || 0}%
                </p>
                <p className="text-xs text-stone-500 font-medium">معدل النجاح الإجمالي</p>
              </div>
            </div>

            {/* Quick Actions & System Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Navigation Panel */}
              <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-black text-stone-900 tracking-tight">إجراءات سريعة</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href="/admin/import"
                    className="p-4 bg-[#faf6f0] hover:bg-amber-100/70 border border-amber-200/80 rounded-2xl flex items-center gap-3 transition-all group"
                  >
                    <div className="p-3 bg-white text-brand-700 rounded-xl border border-amber-200 shadow-sm group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">رفع شيت إكسل</h4>
                      <p className="text-xs text-stone-500">استيراد نتائج دفعة جديدة</p>
                    </div>
                  </Link>

                  <Link
                    href="/admin/results"
                    className="p-4 bg-[#faf6f0] hover:bg-amber-100/70 border border-amber-200/80 rounded-2xl flex items-center gap-3 transition-all group"
                  >
                    <div className="p-3 bg-white text-amber-800 rounded-xl border border-amber-200 shadow-sm group-hover:scale-105 transition-transform">
                      <Table className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900">إدارة السجلات</h4>
                      <p className="text-xs text-stone-500">عرض وتعديل ومسح البيانات</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Import History & Metadata Panel */}
              <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-black text-stone-900 tracking-tight">آخر عمليات التحديث</h3>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[#faf6f0] rounded-2xl border border-amber-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-brand-600" />
                      <span className="text-xs font-bold text-stone-600">تاريخ آخر رفع:</span>
                    </div>
                    <span className="text-xs font-bold text-stone-900 font-mono">
                      {stats?.lastImportDate
                        ? new Date(stats.lastImportDate).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'لم يتم الرفع بعد'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#faf6f0] rounded-2xl border border-amber-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-bold text-stone-600">اسم الملف الأخير:</span>
                    </div>
                    <span className="text-xs font-bold text-amber-900 font-mono truncate max-w-[200px]">
                      {stats?.lastImportedFile || 'غير متوفر'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
