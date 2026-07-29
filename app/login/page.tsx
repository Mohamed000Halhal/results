'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'كلمة المرور غير صحيحة');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f3] text-stone-900 flex flex-col items-center justify-center p-4 selection:bg-brand-600 selection:text-white">
      <div className="w-full max-w-md bg-white/95 border border-amber-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-brand-800 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">تسجيل الدخول</h1>
          <p className="text-xs font-bold text-stone-500">إدارة نتائج الثانوية العامة</p>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs font-bold shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">كلمة المرور</label>
            <div className="relative">
              <div className="absolute inset-y-0 pr-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                className="w-full bg-[#faf6f0] border border-amber-200/90 rounded-2xl py-3 pr-10 pl-4 text-stone-900 font-bold placeholder:text-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3.5 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-600 hover:to-brand-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-700/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <span>دخول</span>
            )}
          </button>
        </form>

        <div className="pt-3 text-center border-t border-amber-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-brand-900 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180 text-brand-600" />
            <span>العودة للصفحة الرئيسية</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
