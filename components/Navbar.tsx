import Link from 'next/link';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import VisitorCounter from './VisitorCounter';

export default function Navbar() {
  return (
    <header className="w-full bg-[#fcf9f4]/90 border-b border-amber-200/60 sticky top-0 z-50 backdrop-blur-xl transition-all shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center space-x-3 space-x-reverse group">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-300/80 bg-white flex items-center justify-center shadow-sm">
            <Image
              src="/logo.png"
              alt="شعار نتائج الثانوية العامة"
              width={40}
              height={40}
              className="object-contain w-full h-full p-0.5"
            />
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight group-hover:text-brand-700 transition-colors">
              نتائج الثانوية العامة
            </h1>
            <p className="text-[11px] text-stone-500 hidden sm:block">بوابة الاستعلام عن نتائج الامتحانات</p>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <VisitorCounter />

          <Link
            href="/top-students"
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-stone-800 bg-amber-100/60 hover:bg-amber-200/70 border border-amber-300/70 transition-all shadow-sm group"
          >
            <Trophy className="w-4 h-4 text-amber-700" />
            <span>قائمة الأوائل</span>
          </Link>
        </div>

      </div>
    </header>
  );
}



