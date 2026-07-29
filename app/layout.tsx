import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'نتائج الثانوية العامة — الاستعلام عن النتيجة',
  description: 'موقع الاستعلام السريع والموثوق عن نتائج امتحانات الثانوية العامة برقم الجلوس أو اسم الطالب',
  keywords: ['نتائج الثانوية العامة', 'نتيجة الثانوية', 'رقم الجلوس', 'اسم الطالب', 'امتحانات'],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} font-sans`}>
      <body className="bg-[#fbf8f3] text-stone-900 min-h-screen flex flex-col selection:bg-brand-600 selection:text-white antialiased">

        {children}
      </body>
    </html>
  );
}
