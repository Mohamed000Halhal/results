'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Printer, Award, User, Hash, Percent, Copy, Check, ArrowRight } from 'lucide-react';

import { motion } from 'framer-motion';

export interface StudentResultData {
  id: string;
  name: string;
  seatNumber: string;
  result: string;
  percentage: number;
}

interface ResultCardProps {
  student: StudentResultData;
  onSearchAgain: () => void;
}

export default function ResultCard({ student, onSearchAgain }: ResultCardProps) {
  const [copied, setCopied] = useState(false);

  const isPassed =
    student.result.includes('ناجح') ||
    student.result.toLowerCase().includes('pass') ||
    student.percentage >= 50;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    const text = `نتيجة الطالب: ${student.name}\nرقم الجلوس: ${student.seatNumber}\nالنسبة المئوية: ${student.percentage}%\nالنتيجة: ${student.result}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Standard Interactive Dark Card (Hidden on Print) */}
      <div className="bg-white/95 backdrop-blur-2xl border border-amber-200/90 rounded-3xl overflow-hidden shadow-xl relative print:hidden">
        
        {/* Top Glowing Header Accent Bar */}
        <div
          className={`h-2.5 w-full ${
            isPassed
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
              : 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600'
          }`}
        />

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-amber-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-100/80 text-brand-800 border border-amber-200/90 shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-stone-900 tracking-tight">بطاقة نتيجة الطالب</h3>
                <p className="text-xs text-stone-500">نتيجة امتحانات شهادة الثانوية العامة</p>

              </div>
            </div>

            {/* Pass / Fail Status Badge */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-sm transition-transform ${
                isPassed
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {isPassed ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>{student.result || 'ناجح'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-700" />
                  <span>{student.result || 'راسب'}</span>
                </>
              )}
            </div>
          </div>

          {/* Student Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div className="bg-[#faf6f0] p-4 rounded-2xl border border-amber-200/70 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                <User className="w-4 h-4 text-brand-600" />
                <span>اسم الطالب:</span>
              </div>
              <p className="text-lg font-bold text-stone-900 tracking-wide pr-1">
                {student.name}
              </p>
            </div>

            {/* Seat Number */}
            <div className="bg-[#faf6f0] p-4 rounded-2xl border border-amber-200/70 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
                <Hash className="w-4 h-4 text-amber-700" />
                <span>رقم الجلوس:</span>
              </div>
              <p className="text-lg font-bold text-amber-900 font-mono tracking-widest pr-1">
                {student.seatNumber}
              </p>
            </div>
          </div>

          {/* Prominent Percentage Visual Box */}
          <div className="relative overflow-hidden bg-gradient-to-b from-[#faf6f0] to-[#f5ebd9] border border-amber-200/80 p-6 rounded-2xl text-center space-y-4 shadow-inner">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-stone-600 uppercase tracking-wider">
              <Percent className="w-4 h-4 text-brand-600" />
              <span>النسبة المئوية الإجمالية</span>
            </div>

            <div className="flex items-baseline justify-center gap-1">
              <span
                className={`text-5xl sm:text-6xl font-black tracking-tight font-mono ${
                  isPassed
                    ? 'text-emerald-800'
                    : 'text-rose-800'
                }`}
              >
                {student.percentage}%
              </span>
            </div>

            {/* Glowing Animated Progress Bar */}
            <div className="w-full max-w-md mx-auto bg-amber-100/90 h-3.5 rounded-full overflow-hidden p-0.5 border border-amber-200 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, student.percentage))}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`h-full rounded-full shadow-md ${
                  isPassed
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                    : 'bg-gradient-to-r from-rose-600 to-red-500'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 print:hidden">
            <button
              onClick={onSearchAgain}
              className="w-full sm:flex-1 py-3.5 px-5 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-700/20 flex items-center justify-center gap-2 group"
            >
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              <span>العودة لصفحة البحث</span>
            </button>

            <button
              onClick={handleCopy}
              className="w-full sm:w-auto py-3.5 px-4 bg-white hover:bg-amber-50 text-stone-800 font-bold rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-2 shadow-sm"
              title="نسخ بيانات النتيجة"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-800">تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-600" />
                  <span>نسخ</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="w-full sm:w-auto py-3.5 px-5 bg-white hover:bg-amber-50 text-stone-800 font-bold rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span>طباعة الشهادة</span>
            </button>
          </div>

        </div>
      </div>


      {/* Printable Official Certificate View (Only Visible During Printing) */}
      <div className="hidden print:block text-slate-900 font-sans p-8 border-4 border-amber-600 rounded-xl max-w-3xl mx-auto my-0 bg-white">
        <div className="border-2 border-slate-900 p-6 space-y-6 text-center">
          
          {/* Certificate Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div className="text-right space-y-1">
              <h2 className="text-sm font-bold">جمهورية مصر العربية</h2>
              <h3 className="text-xs font-semibold text-slate-700">وزارة التربية والتعليم والتعليم الفني</h3>
              <p className="text-[10px] text-slate-500">الإدارة المركزية للامتحانات</p>
            </div>
            
            <div className="w-16 h-16 relative flex items-center justify-center">
              <img src="/logo.png" alt="شعار النتيجة" className="w-full h-full object-contain" />
            </div>

            <div className="text-left space-y-1">
              <p className="text-xs font-bold">العام الدراسي الحالي</p>
              <p className="text-[10px] text-slate-500">نتيجة امتحانات الثانوية العامة</p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="space-y-1 py-2">
            <h1 className="text-xl font-black tracking-wide text-slate-950">
              كشف رسمى بنتيجة امتحان شهادة إتمام الدراسة الثانوية العامة
            </h1>
            <p className="text-xs text-slate-600">بيان رسمى معتمد ومسجل إلكترونياً</p>
          </div>

          {/* Student Info Details Table */}
          <div className="border border-slate-400 rounded-lg overflow-hidden text-right text-sm">
            <div className="grid grid-cols-2 border-b border-slate-300 bg-slate-100 p-3">
              <div>
                <span className="font-bold text-slate-600">اسم الطالب: </span>
                <span className="font-black text-slate-900 text-base">{student.name}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">رقم الجلوس: </span>
                <span className="font-black text-slate-900 font-mono text-base">{student.seatNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 p-3 bg-white">
              <div>
                <span className="font-bold text-slate-600">حالة النتيجة: </span>
                <span className={`font-black ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {student.result || (isPassed ? 'ناجح دور أول' : 'راسب')}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600">النسبة المئوية الإجمالية: </span>
                <span className="font-black text-slate-900 font-mono text-lg">{student.percentage}%</span>
              </div>
            </div>
          </div>

          {/* Official Verification & Stamp Section */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-300 text-xs text-slate-600">
            <div className="text-right space-y-1">
              <p className="font-bold text-slate-800">اعتماد النتيجة والتوقيع الإلكتروني:</p>
              <p className="text-[11px] font-mono text-slate-500">ID: {student.id}</p>
            </div>

            <div className="border-2 border-dashed border-amber-600 rounded-full w-24 h-24 flex flex-col items-center justify-center text-amber-700 font-bold text-[10px] p-2 text-center rotate-[-10deg]">
              <span>ختم الاعتماد</span>
              <span className="text-[8px] mt-0.5">وزارة التربية والتعليم</span>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );

}

