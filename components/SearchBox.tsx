'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, X, Binary, User, ArrowLeft, Lightbulb } from 'lucide-react';
import { isSeatNumber } from '@/lib/arabic';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export default function SearchBox({ onSearch, isLoading, initialQuery = '' }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [detectedType, setDetectedType] = useState<'seat' | 'name' | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setDetectedType(null);
    } else if (isSeatNumber(query)) {
      setDetectedType('seat');
    } else {
      setDetectedType('name');
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    setDetectedType(null);
  };

  const handleChipClick = (sample: string) => {
    setQuery(sample);
    onSearch(sample);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <form onSubmit={handleSubmit}>
        <div className="relative flex flex-col sm:flex-row items-center bg-white border border-amber-300/80 rounded-2xl sm:rounded-3xl p-2 shadow-md space-y-2 sm:space-y-0">
          
          {/* Input Area */}
          <div className="relative w-full flex items-center pr-3">
            <Search className="w-5 h-5 text-stone-500 shrink-0" />

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="أدخل رقم الجلوس أو اسم الطالب..."
              className="w-full bg-transparent py-4 px-3 text-stone-900 placeholder-stone-400 focus:outline-none text-base sm:text-lg font-medium"
              disabled={isLoading}
              dir="rtl"
              autoFocus
            />

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors ml-1"
                title="مسح النص"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Type Indicator & Submit Action */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end px-2 sm:px-0">
            {detectedType && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                detectedType === 'seat'
                  ? 'bg-amber-100/90 text-amber-900 border border-amber-300'
                  : 'bg-brand-100/90 text-brand-900 border border-brand-300'
              }`}>
                {detectedType === 'seat' ? (
                  <>
                    <Binary className="w-3.5 h-3.5 text-amber-700" />
                    <span>رقم جلوس</span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-brand-700" />
                    <span>اسم طالب</span>
                  </>
                )}
              </span>
            )}

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full sm:w-auto px-7 py-3.5 bg-brand-700 hover:bg-brand-800 text-white font-bold text-base rounded-xl sm:rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري البحث...</span>
                </>
              ) : (
                <>
                  <span>بحث</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      {/* Clean Example Searches */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-stone-500 pt-1">
        <span className="font-semibold text-stone-600">أمثلة للبحث:</span>
        <button
          onClick={() => handleChipClick('2001970')}
          className="px-3 py-1 rounded-full bg-white border border-amber-200/80 hover:border-brand-500 hover:text-brand-800 font-mono transition-all shadow-sm"
        >
          2001970
        </button>
        <button
          onClick={() => handleChipClick('2769465')}
          className="px-3 py-1 rounded-full bg-white border border-amber-200/80 hover:border-amber-600 hover:text-amber-900 font-mono transition-all shadow-sm"
        >
          2769465
        </button>
        <button
          onClick={() => handleChipClick('احمد')}
          className="px-3 py-1 rounded-full bg-white border border-amber-200/80 hover:border-brand-500 hover:text-brand-800 transition-all shadow-sm"
        >
          أحمد
        </button>
      </div>
    </div>
  );


}

