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
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
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
      // 1. Read file in browser as ArrayBuffer (0 server upload limit!)
      const arrayBuffer = await file.arrayBuffer();

      // 2. Parse Excel buffer directly in client JS
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
      const BATCH_SIZE = 2000; // 2,000 records per batch (~150KB per request)
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
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">استيراد نتائج من Excel</h1>
            <p className="text-xs text-slate-400 mt-1">
              قم برفع ملف Excel لإدراج النتائج فورياً في قاعدة البيانات
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <span>العودة للوحة التحكم</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Success Alert */}
        {importSuccessMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between text-emerald-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span className="font-bold">{importSuccessMsg}</span>
            </div>
            <Link
              href="/admin/results"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              عرض سجل النتائج
            </Link>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-rose-300 text-sm">
            <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Dropzone */}
        {!validationResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-3xl mx-auto space-y-6">
            <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-2xl p-8 text-center space-y-4 transition-colors bg-slate-950/40">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                <UploadCloud className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">اختر ملف Excel من جهازك</h3>
                <p className="text-xs text-slate-400">يدعم صيغ .xlsx و .xls و .csv (حتى 900 ألف طالب)</p>
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-brand-400" />
                <span>{file ? file.name : 'تحديد الملف'}</span>
              </label>
            </div>

            {/* Expected format helper */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <p className="text-xs font-semibold text-slate-300">أعمدة الملف المطلوبة:</p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-400 font-mono">
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">الاسم (Name)</span>
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">رقم الجلوس (Seat Number)</span>
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">النتيجة (Result)</span>
                <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800">النسبة المئوية (Percentage)</span>
              </div>
            </div>

            <button
              onClick={handleAnalyzeFile}
              disabled={!file || isAnalyzing}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-6 h-6 text-brand-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">{validationResult.fileName}</h3>
                    <p className="text-xs text-slate-400">تقرير فحص بنية وجودة السجلات</p>
                  </div>
                </div>

                <button
                  onClick={() => setValidationResult(null)}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تغيير الملف</span>
                </button>
              </div>

              {/* Stats pill */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">إجمالي الصفوف بالملف</span>
                  <p className="text-2xl font-black text-white font-mono">{validationResult.totalRows.toLocaleString('ar-EG')}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-emerald-400 font-semibold">السجلات الصالحة للاستيراد</span>
                  <p className="text-2xl font-black text-emerald-400 font-mono">{validationResult.validCount.toLocaleString('ar-EG')}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-rose-400 font-semibold">الصفوف غير الصالحة (المرفوضة)</span>
                  <p className="text-2xl font-black text-rose-400 font-mono">{validationResult.invalidCount.toLocaleString('ar-EG')}</p>
                </div>
              </div>

              {/* Detected Columns */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300">الأعمدة التي تم التعرّف عليها تلقائياً:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">عمود الاسم:</span>
                    <span className="text-brand-300 font-bold">{validationResult.detectedColumns.nameCol || 'غير محدد'}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">عمود رقم الجلوس:</span>
                    <span className="text-amber-300 font-bold">{validationResult.detectedColumns.seatCol || 'غير محدد'}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">عمود النتيجة:</span>
                    <span className="text-emerald-300 font-bold">{validationResult.detectedColumns.resultCol || 'افتراضي (ناجح)'}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">عمود النسبة:</span>
                    <span className="text-brand-300 font-bold">{validationResult.detectedColumns.percentageCol || 'غير محدد'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invalid Rows Report */}
            {validationResult.invalidRows.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>تنبيه: يوجد {validationResult.invalidCount} صف محذوف لعدم استيفاء الشروط</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {validationResult.invalidRows.map((inv, idx) => (
                    <div key={idx} className="bg-slate-950/80 p-2.5 rounded-lg text-xs text-rose-200 flex justify-between">
                      <span>الصف #{inv.rowNumber}</span>
                      <span className="font-semibold text-rose-400">{inv.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Progress Bar during Batch Upload */}
            {importProgress && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-brand-400">جاري الرفع المباشر في دفعات صغيرة (لتفادي حد السيرفر)...</span>
                  <span className="text-white font-mono">{importProgress.current.toLocaleString('ar-EG')} / {importProgress.total.toLocaleString('ar-EG')} ({importProgress.percent}%)</span>
                </div>

                <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full transition-all duration-300 shadow-md"
                    style={{ width: `${importProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Import Mode Selector & Final Action */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-400" />
                  <span>طريقة حفظ البيانات في قاعدة البيانات:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-4 rounded-xl border text-right space-y-1 transition-all ${
                      importMode === 'replace'
                        ? 'bg-brand-600/10 border-brand-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="text-sm font-bold">استبدال البيانات السابقة (مسح القديم)</p>
                    <p className="text-xs opacity-75">حذف نتائج الطلاب الحالية في قاعدة البيانات وتنزيل الملف الجديد بالكامل</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`p-4 rounded-xl border text-right space-y-1 transition-all ${
                      importMode === 'append'
                        ? 'bg-brand-600/10 border-brand-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <p className="text-sm font-bold">إضافة إلى البيانات الحالية (دمج)</p>
                    <p className="text-xs opacity-75">الاحتفاظ بالنتائج السابقة وإضافة السجلات الجديدة بالملف فوقها</p>
                  </button>
                </div>
              </div>

              <button
                onClick={handleConfirmImport}
                disabled={isImporting || validationResult.validCount === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 text-base"
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
