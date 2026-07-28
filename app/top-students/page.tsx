'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ResultCard, { StudentResultData } from '@/components/ResultCard';
import { Trophy, Award, Crown, Loader2, Sparkles, Hash, ArrowRight, Medal } from 'lucide-react';
import Link from 'next/link';

export default function TopStudentsPage() {
  const [students, setStudents] = useState<StudentResultData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentResultData | null>(null);

  useEffect(() => {
    async function fetchTopStudents() {
      try {
        const res = await fetch('/api/top-students');
        const data = await res.json();
        if (data.success) {
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error('Fetch top students error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTopStudents();
  }, []);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 text-lg">
          <Crown className="w-6 h-6 fill-current" />
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 flex items-center justify-center font-black shadow-md text-lg">
          <Medal className="w-5 h-5 fill-current" />
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white flex items-center justify-center font-black shadow-md text-lg">
          <Award className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold font-mono text-sm">
        #{index + 1}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf8f3] text-stone-900">
      <Navbar />

      <main className="flex-1 px-4 py-12 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-100/90 text-amber-900 border border-amber-300 shadow-sm">
            <Trophy className="w-4 h-4 text-amber-700" />
            <span>لوحة الشرف الرسمية</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
            أوائل الثانوية العامة
          </h1>

          <p className="text-sm sm:text-base text-stone-600 font-medium">
            قائمة الطلاب الحاصلين على أعلى الدرجات والنسب المئوية على مستوى الجمهورية
          </p>
        </div>

        {/* Selected Student Modal View */}
        {selectedStudent ? (
          <div className="space-y-6">
            <div className="text-center">
              <button
                onClick={() => setSelectedStudent(null)}
                className="inline-flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white border border-amber-200 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <ArrowRight className="w-4 h-4 text-brand-600" />
                <span>العودة لقائمة الأوائل</span>
              </button>
            </div>
            <ResultCard
              student={selectedStudent}
              onSearchAgain={() => setSelectedStudent(null)}
            />
          </div>
        ) : (
          /* Top Students Leaderboard List */
          <div className="bg-white/95 border border-amber-200/90 rounded-3xl overflow-hidden shadow-xl space-y-0">
            {isLoading ? (
              <div className="p-16 text-center">
                <Loader2 className="w-8 h-8 text-amber-700 animate-spin mx-auto" />
                <p className="text-xs text-stone-500 mt-3">جاري تحميل قائمة الأوائل...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-stone-500 text-sm">
                لم يتم إضافة نتائج بعد لعرض قائمة الأوائل
              </div>
            ) : (
              <div className="divide-y divide-amber-100">
                {students.map((student, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all cursor-pointer group ${
                        isTop3
                          ? 'bg-gradient-to-r from-amber-50/80 via-white to-white hover:from-amber-100/70'
                          : 'hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {getRankBadge(idx)}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-brand-700 transition-colors">
                              {student.name}
                            </h3>
                            {idx === 0 && (
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                                المركز الأول
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-500">
                            <span className="flex items-center gap-1 font-mono text-amber-900 font-bold">
                              <Hash className="w-3.5 h-3.5 text-amber-700" />
                              {student.seatNumber}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">{student.result || 'ناجح'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Percentage pill */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-amber-100 pt-3 sm:pt-0">
                        <span className="text-xs text-stone-500 sm:hidden">النسبة المئوية:</span>
                        <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 shadow-inner flex items-baseline gap-0.5">
                          <span className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
                            {student.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );

}
