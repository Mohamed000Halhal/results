'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchBox from '@/components/SearchBox';
import ResultCard, { StudentResultData } from '@/components/ResultCard';
import MultipleResultsList from '@/components/MultipleResultsList';
import { AlertCircle, ArrowRight } from 'lucide-react';


export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [singleStudent, setSingleStudent] = useState<StudentResultData | null>(null);
  const [multipleStudents, setMultipleStudents] = useState<StudentResultData[] | null>(null);
  const [totalMatches, setTotalMatches] = useState<number | undefined>(undefined);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSingleStudent(null);
    setMultipleStudents(null);
    setTotalMatches(undefined);

    try {
      const res = await fetch(`/api/results/search?q=${encodeURIComponent(query)}`);

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'حدث خطأ أثناء البحث');
        return;
      }

      if (data.type === 'none') {
        setErrorMsg(data.message || 'لم يتم العثور على نتائج');
      } else if (data.type === 'single') {
        setSingleStudent(data.result);
      } else if (data.type === 'multiple') {
        setMultipleStudents(data.results);
        setTotalMatches(data.count);
      }
    } catch (err) {
      console.error('Search request failed:', err);
      setErrorMsg('تعذر الاتصال بالسيرفر. يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAgain = () => {
    setSingleStudent(null);
    setMultipleStudents(null);
    setTotalMatches(undefined);
    setErrorMsg(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fbf8f3] text-stone-900 selection:bg-brand-600 selection:text-white">
      <Navbar />


      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 max-w-4xl mx-auto w-full space-y-8 z-10">
        
        {/* Minimal Title */}
        {!singleStudent && !multipleStudents && (
          <div className="text-center space-y-2 mb-2">
            <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight">
              نتائج الثانوية العامة
            </h1>
          </div>
        )}

        {/* Search Box */}
        {!singleStudent && !multipleStudents && (
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        )}

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="w-full max-w-2xl bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-sm font-bold animate-fadeIn shadow-md">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Back to Search Button when Result is Active */}
        {(singleStudent || multipleStudents) && (
          <div className="w-full max-w-2xl mx-auto flex justify-start pb-2">
            <button
              onClick={handleSearchAgain}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-amber-200/90 hover:bg-amber-50 text-stone-800 hover:text-brand-900 font-bold text-sm transition-all shadow-md group"
            >
              <ArrowRight className="w-4 h-4 text-brand-600 group-hover:translate-x-1 transition-transform" />
              <span>العودة لصفحة البحث</span>
            </button>
          </div>
        )}

        {/* Single Match Result Card */}
        {singleStudent && (
          <ResultCard student={singleStudent} onSearchAgain={handleSearchAgain} />
        )}

        {/* Multiple Matches Disambiguation List */}
        {multipleStudents && (
          <MultipleResultsList
            results={multipleStudents}
            totalCount={totalMatches}
            onSelectStudent={(student) => {
              setSingleStudent(student);
              setMultipleStudents(null);
            }}
            onSearchAgain={handleSearchAgain}
          />
        )}

      </main>

      <Footer />
    </div>
  );

}


