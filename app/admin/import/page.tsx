'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Loader2, ArrowRight, RefreshCw, Database } from 'lucide-react';
import Link from 'next/link';
import { parseExcelBuffer } from '@/lib/excel';

interface ValidationResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  detectedColumns: {
    nameCol?: string;
    seatCol?: string;
    resultCol?: string;
    percentageCol?: string;
  };
  validRecords: any[];
  invalidRows: { rowNumber: number; reason: string; rawRowData: any }[];
}

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; percent: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setErrorMsg(null);
      setImportSuccessMsg(null);
      setImportProgress(null);
    }
  };

  const handleAnalyzeFile = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setValidationResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = parseExcelBuffer(arrayBuffer);

      setValidationResult({
        fileName: file.name,
        totalRows: result.totalRows,
        validCount: result.validRecords.length,
        invalidCount: result.invalidRows.length,
        detectedColumns: result.detectedColumns,
        validRecords: result.validRecords,
        invalidRows: result.invalidRows.slice(0, 100),
      });
    } catch (err) {
      console.error('Analyze error:', err);
      setErrorMsg('تعذر قراءة ملف الإكسل. يرجى التأكد من صحة الملف وصيغته');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validRecords.length === 0) return;
    setIsImporting(true);
    setErrorMsg(null);
    setImportProgress({ current: 0, total: validationResult.validCount, percent: 0 });

    try {
      const records = validationResult.validRecords;
      const totalCount = records.length;
      const BATCH_SIZE = 2000;
      let importedSoFar = 0;

      for (let i = 0; i < totalCount; i += BATCH_SIZE) {
        const chunk = records.slice(i, i + BATCH_SIZE);
        const isFirstBatch = i === 0;
        const isLastBatch = i + BATCH_SIZE >= totalCount;

        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: chunk,
            mode: importMode,
            fileName: validationResult.fileName,
            isFirstBatch,
            isLastBatch,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'حدث خطأ أثناء حفظ أحد الأجزاء');
        }

        importedSoFar += chunk.length;
        const percent = Math.min(100, Math.round((importedSoFar / totalCount) * 100));
        setImportProgress({
          current: importedSoFar,
          total: totalCount,
          percent,
        });
      }

      setImportSuccessMsg(`تم استيراد كافة النتائج بنجاح (${totalCount.toLocaleString('ar-EG')} طالب)!`);
      setValidationResult(null);
      setFile(null);
    } catch (err: any) {
      console.error('Confirm import error:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء رفع البيانات إلى السيرفر');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-stone-900 flex flex-col md:flex-row selection:bg-brand-600 selection:text-white">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-200/90 pb-6">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">استيراد نتائج من Excel</h1>
            <p className="text-xs font-bold text-stone-500 mt-1">
              قم برفع ملف Excel لإدراج النتائج فورياً في قاعدة البيانات
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-brand-900 transition-colors"
          >
            <span>العودة للوحة التحكم</span>
            <ArrowRight className="w-4 h-4 rotate-180 text-brand-600" />
          </Link>
        </div>

        {/* Success Alert */}
        {importSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-center justify-between text-emerald-900 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <span className="font-bold">{importSuccessMsg}</span>
            </div>
            <Link
              href="/admin/results"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              عرض سجل النتائج
            </Link>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 flex items-center gap-3 text-rose-800 text-sm font-bold shadow-sm">
            <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Dropzone */}
        {!validationResult && (
          <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-8 max-w-3xl mx-auto space-y-6 shadow-sm">
            <div className="border-2 border-dashed border-amber-300 hover:border-brand-600 rounded-3xl p-8 text-center space-y-4 transition-all bg-[#faf6f0]">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-brand-800 flex items-center justify-center mx-auto border border-amber-200 shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-stone-900">اختر ملف Excel من جهازك</h3>
                <p className="text-xs font-bold text-stone-500">يدعم صيغ .xlsx و .xls و .csv (حتى 900 ألف طالب)</p>
              </div>

              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />

              <label
                htmlFor="excel-file-input"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-amber-50 text-stone-800 text-xs font-bold rounded-2xl border border-amber-200 cursor-pointer transition-all shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-brand-700" />
                <span>{file ? file.name : 'تحديد الملف'}</span>
              </label>
            </div>

            {/* Expected format helper */}
            <div className="bg-[#faf6f0] p-4 rounded-2xl border border-amber-200/80 space-y-2">
              <p className="text-xs font-bold text-stone-700">أعمدة الملف المطلوبة:</p>
              <div className="flex flex-wrap gap-2 text-xs text-stone-800 font-mono font-bold">
                <span className="bg-white px-3 py-1 rounded-xl border border-amber-200">الاسم (Name)</span>
                <span className="bg-white px-3 py-1 rounded-xl border border-amber-200">رقم الجلوس (Seat Number)</span>
                <span className="bg-white px-3 py-1 rounded-xl border border-amber-200">النتيجة (Result)</span>
                <span className="bg-white px-3 py-1 rounded-xl border border-amber-200">النسبة المئوية (Percentage)</span>
              </div>
            </div>

            <button
              onClick={handleAnalyzeFile}
              disabled={!file || isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-700/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري فحص وقراءة الملف في المتصفح...</span>
                </>
              ) : (
                <span>قراءة وفحص البيانات</span>
              )}
            </button>
          </div>
        )}

        {/* Validation & Confirmation Section */}
        {validationResult && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Analysis Header Card */}
            <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 text-brand-800 rounded-2xl border border-amber-200">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-stone-900">{validationResult.fileName}</h3>
                    <p className="text-xs font-bold text-stone-500">تقرير فحص بنية وجودة السجلات</p>
                  </div>
                </div>

                <button
                  onClick={() => setValidationResult(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تغيير الملف</span>
                </button>
              </div>

              {/* Stats pill */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#faf6f0] p-4 rounded-2xl border border-amber-200/80">
                  <span className="text-xs font-bold text-stone-500">إجمالي الصفوف بالملف</span>
                  <p className="text-2xl font-black text-stone-900 font-mono">{validationResult.totalRows.toLocaleString('ar-EG')}</p>
                </div>
                <div className="bg-[#faf6f0] p-4 rounded-2xl border border-amber-200/80">
                  <span className="text-xs text-emerald-800 font-bold">السجلات الصالحة للاستيراد</span>
                  <p className="text-2xl font-black text-emerald-800 font-mono">{validationResult.validCount.toLocaleString('ar-EG')}</p>
                </div>
                <div className="bg-[#faf6f0] p-4 rounded-2xl border border-amber-200/80">
                  <span className="text-xs text-rose-800 font-bold">الصفوف غير الصالحة (المرفوضة)</span>
                  <p className="text-2xl font-black text-rose-800 font-mono">{validationResult.invalidCount.toLocaleString('ar-EG')}</p>
                </div>
              </div>

              {/* Detected Columns */}
              <div className="bg-[#faf6f0] p-4 rounded-2xl border border-amber-200/80 space-y-2">
                <h4 className="text-xs font-bold text-stone-700">الأعمدة التي تم التعرّف عليها تلقائياً:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-stone-500 block text-[10px] font-bold">عمود الاسم:</span>
                    <span className="text-brand-900 font-extrabold">{validationResult.detectedColumns.nameCol || 'غير محدد'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-stone-500 block text-[10px] font-bold">عمود رقم الجلوس:</span>
                    <span className="text-amber-900 font-extrabold">{validationResult.detectedColumns.seatCol || 'غير محدد'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-stone-500 block text-[10px] font-bold">عمود النتيجة:</span>
                    <span className="text-emerald-900 font-extrabold">{validationResult.detectedColumns.resultCol || 'افتراضي (ناجح)'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-stone-500 block text-[10px] font-bold">عمود النسبة:</span>
                    <span className="text-brand-900 font-extrabold">{validationResult.detectedColumns.percentageCol || 'غير محدد'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invalid Rows Report */}
            {validationResult.invalidRows.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>تنبيه: يوجد {validationResult.invalidCount} صف محذوف لعدم استيفاء الشروط</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {validationResult.invalidRows.map((inv, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-rose-200 text-xs text-stone-800 flex justify-between font-bold">
                      <span>الصف #{inv.rowNumber}</span>
                      <span className="text-rose-700">{inv.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Progress Bar during Batch Upload */}
            {importProgress && (
              <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-6 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-brand-800">جاري الرفع المباشر في دفعات صغيرة (لتفادي حد السيرفر)...</span>
                  <span className="text-stone-900 font-mono">{importProgress.current.toLocaleString('ar-EG')} / {importProgress.total.toLocaleString('ar-EG')} ({importProgress.percent}%)</span>
                </div>

                <div className="w-full bg-amber-100 h-4 rounded-full overflow-hidden p-0.5 border border-amber-200 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-brand-700 to-emerald-600 rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${importProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Import Mode Selector & Final Action */}
            <div className="bg-white/95 border border-amber-200/90 rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="space-y-3">
                <label className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-700" />
                  <span>طريقة حفظ البيانات في قاعدة البيانات:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`p-4 rounded-2xl border text-right space-y-1 transition-all ${
                      importMode === 'append'
                        ? 'bg-amber-100/90 border-brand-600 text-stone-900 font-bold shadow-sm'
                        : 'bg-[#faf6f0] border-amber-200/80 text-stone-600 hover:text-stone-900 font-bold'
                    }`}
                  >
                    <p className="text-sm font-black">إضافة إلى البيانات الحالية (دمج م الموصى به)</p>
                    <p className="text-xs font-medium text-stone-500">الاحتفاظ بالنتائج السابقة وإضافة السجلات الجديدة بالملف فوقها دون مسح</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-4 rounded-2xl border text-right space-y-1 transition-all ${
                      importMode === 'replace'
                        ? 'bg-amber-100/90 border-brand-600 text-stone-900 font-bold shadow-sm'
                        : 'bg-[#faf6f0] border-amber-200/80 text-stone-600 hover:text-stone-900 font-bold'
                    }`}
                  >
                    <p className="text-sm font-black text-rose-700">استبدال البيانات السابقة (مسح القديم)</p>
                    <p className="text-xs font-medium text-stone-500">حذف نتائج الطلاب الحالية في قاعدة البيانات وتنزيل الملف الجديد بالكامل</p>
                  </button>
                </div>
              </div>

              <button
                onClick={handleConfirmImport}
                disabled={isImporting || validationResult.validCount === 0}
                className="w-full py-4 bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 disabled:opacity-50 text-base"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري رفع الدفعات... ({importProgress?.percent || 0}%)</span>
                  </>
                ) : (
                  <span>تأكيد استيراد ({validationResult.validCount.toLocaleString('ar-EG')}) نتيجة إلى السيرفر</span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
