export default function Footer() {
  return (
    <footer className="w-full bg-[#fcf9f4] border-t border-amber-200/80 py-8 text-center text-xs mt-auto">
      <div className="max-w-6xl mx-auto px-4 space-y-1">
        <p className="font-bold text-stone-800">
          نظام الاستعلام عن نتائج الثانوية العامة © {new Date().getFullYear()}
        </p>
        <p className="text-stone-500 font-medium">
          تم تطوير المنصة بأعلى معايير السرعة والأمان وحماية البيانات
        </p>
      </div>
    </footer>
  );
}



