'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileSpreadsheet, Table, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'الرئيسية والإحصائيات', href: '/admin', icon: LayoutDashboard },
    { label: 'استيراد من إكسل', href: '/admin/import', icon: FileSpreadsheet },
    { label: 'سجل النتائج والتعديل', href: '/admin/results', icon: Table },
  ];

  return (
    <aside className="w-full md:w-64 bg-white/95 border-b md:border-b-0 md:border-l border-amber-200/90 p-5 flex flex-col justify-between shrink-0 shadow-sm">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-1 border-b border-amber-100 pb-4">
          <div className="p-2.5 rounded-2xl bg-amber-100 text-brand-800 border border-amber-200 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-stone-900 tracking-tight">لوحة الإدارة</h2>
            <p className="text-xs text-stone-500 font-medium">إدارة نتائج الطلاب</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white font-bold shadow-md shadow-brand-700/20'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-amber-100/60 font-bold'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Nav & Logout */}
      <div className="pt-6 border-t border-amber-100 space-y-2 mt-6 md:mt-0">
        <Link
          href="/"
          className="flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-600 hover:text-brand-900 hover:bg-amber-100/60 transition-colors"
        >
          <span>العودة للموقع العام</span>
          <ArrowRight className="w-4 h-4 rotate-180 text-brand-600" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
