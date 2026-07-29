'use client';

import { StudentResultData } from './ResultCard';
import { Users, ArrowLeft, ArrowRight, Hash } from 'lucide-react';

import { motion } from 'framer-motion';

interface MultipleResultsListProps {
  results: StudentResultData[];
  totalCount?: number;
  onSelectStudent: (student: StudentResultData) => void;
  onSearchAgain: () => void;
}

export default function MultipleResultsList({
  results,
  totalCount,
  onSelectStudent,
  onSearchAgain,
}: MultipleResultsListProps) {
  const displayCount = totalCount || results.length;
  const isTruncated = totalCount && totalCount > results.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      {/* Alert Header Box */}
      <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-5 flex items-start gap-4 shadow-md backdrop-blur-xl">
        <div className="p-3 bg-amber-200/80 text-amber-900 rounded-xl mt-0.5 border border-amber-300">
          <Users className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-amber-950">
            {isTruncated
              ? `تم العثور على ${displayCount.toLocaleString('ar-EG')} طالب (يتم عرض أول ${results.length} نتائج)`
              : `تم العثور على ${results.length.toLocaleString('ar-EG')} نتائج`}
          </h3>
          <p className="text-xs text-amber-900/80 leading-relaxed font-bold">
            {isTruncated
              ? 'اختر الطالب المطلوب أدناه، أو قم بتضييق نطاق البحث لكتابة الاسم الثلاثي/الرباعي أو رقم الجلوس.'
              : 'اختر الطالب المطلوب من القائمة أدناه لعرض بطاقة النتيجة المفصلة:'}
          </p>
        </div>
      </div>

      {/* Results Selector List */}
      <div className="bg-white/95 backdrop-blur-2xl border border-amber-200/90 rounded-3xl overflow-hidden shadow-xl divide-y divide-amber-100">
        {results.map((student) => {
          const isPassed =
            student.result.includes('ناجح') ||
            student.result.toLowerCase().includes('pass') ||
            student.percentage >= 50;

          return (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-50/70 transition-all cursor-pointer group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-base font-bold text-stone-900 group-hover:text-brand-700 transition-colors">
                    {student.name}
                  </h4>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      isPassed
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {student.result || (isPassed ? 'ناجح' : 'راسب')}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1 font-mono text-amber-900 font-bold">
                    <Hash className="w-3.5 h-3.5 text-amber-700" />
                    {student.seatNumber}
                  </span>
                  <span>•</span>
                  <span>النسبة: <strong className="text-stone-900 font-mono">{student.percentage}%</strong> ({Math.round(student.percentage * 3.2 * 10) / 10} درجة من 320)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-brand-700 text-sm font-bold group-hover:text-brand-600">
                <span>عرض النتيجة</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-3">
        <button
          onClick={onSearchAgain}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-amber-200/90 hover:bg-amber-50 text-stone-800 font-bold text-xs transition-all shadow-sm group"
        >
          <ArrowRight className="w-4 h-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
          <span>العودة لصفحة البحث</span>
        </button>
      </div>
    </motion.div>


  );
}

