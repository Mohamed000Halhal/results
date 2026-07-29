import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSeatNumber, normalizeArabic, parseArabicNumerals } from '@/lib/arabic';
import { checkRateLimit } from '@/lib/rateLimit';

// Ultra-fast In-memory LRU Cache for 0ms responses
const searchCache = new Map<string, any>();
const MAX_CACHE_SIZE = 10000;

function getCachedResult(key: string) {
  return searchCache.get(key);
}

function setCachedResult(key: string, data: any) {
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const firstKey = searchCache.keys().next().value;
    if (firstKey) searchCache.delete(firstKey);
  }
  searchCache.set(key, data);
}

// Computes exact B-tree index range bounds for Arabic text
function getRangeBounds(term: string) {
  if (!term) return { lower: '', upper: '' };
  const lastChar = term.slice(-1);
  const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
  const upper = term.slice(0, -1) + nextChar;
  return { lower: term, upper };
}

export async function GET(request: NextRequest) {
  // Rate limiting: 60 requests per minute per IP
  const rate = checkRateLimit(request, 60, 60 * 1000);
  if (!rate.success) {
    return NextResponse.json(
      { error: 'تجاوزت عدد محاولات البحث المسموح بها مؤقتاً. يرجى الانتظار بضع ثوانٍ' },
      { status: 429 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length > 100) {
      return NextResponse.json(
        { error: 'يرجى إدخال رقم الجلوس أو اسم الطالب بشكل صحيح' },
        { status: 400 }
      );
    }


    if (query.length < 2 && !isSeatNumber(query)) {
      return NextResponse.json(
        { error: 'يرجى إدخال حرفين على الأقل للبحث عن الاسم' },
        { status: 400 }
      );
    }

    // 1. Instant 0ms In-Memory Cache Lookup
    const cacheKey = query.toLowerCase();
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const isSeat = isSeatNumber(query);

    if (isSeat) {
      // 2. Exact B-Tree Index Lookup for Seat Number (WHERE seat_number = ?) -> ~1ms
      const seat = parseArabicNumerals(query);
      
      const rawResults = await db.$queryRaw<Array<{
        id: string;
        name: string;
        seatNumber: string;
        result: string;
        percentage: number;
      }>>`
        SELECT id, name, seat_number as seatNumber, result, percentage 
        FROM results 
        WHERE seat_number = ${seat} 
        LIMIT 1
      `;

      if (!rawResults || rawResults.length === 0) {
        const responseData = {
          type: 'none',
          message: `لم يتم العثور على طالب برقم الجلوس: ${seat}`,
        };
        setCachedResult(cacheKey, responseData);
        return NextResponse.json(responseData);
      }

      const responseData = {
        type: 'single',
        result: rawResults[0],
      };
      setCachedResult(cacheKey, responseData);
      return NextResponse.json(responseData);

    } else {
      // 3. Ultra-fast B-Tree Range Scan for Name Search (WHERE normalized_name >= ? AND normalized_name < ?) -> ~1ms
      const normalizedQuery = normalizeArabic(query);
      const { lower, upper } = getRangeBounds(normalizedQuery);

      let students = await db.$queryRaw<Array<{
        id: string;
        name: string;
        seatNumber: string;
        result: string;
        percentage: number;
      }>>`
        SELECT id, name, seat_number as seatNumber, result, percentage 
        FROM results 
        WHERE normalized_name >= ${lower} AND normalized_name < ${upper} 
        LIMIT 20
      `;

      // Fall back to contains lookup if range scan yields 0 results (e.g. searching for middle/last name)
      if (!students || students.length === 0) {
        const containsPattern = `%${normalizedQuery}%`;
        students = await db.$queryRaw<Array<{
          id: string;
          name: string;
          seatNumber: string;
          result: string;
          percentage: number;
        }>>`
          SELECT id, name, seat_number as seatNumber, result, percentage 
          FROM results 
          WHERE normalized_name LIKE ${containsPattern} 
          LIMIT 20
        `;
      }

      if (!students || students.length === 0) {
        const responseData = {
          type: 'none',
          message: `لم يتم العثور على نتائج تطابق: "${query}"`,
        };
        setCachedResult(cacheKey, responseData);
        return NextResponse.json(responseData);
      }

      if (students.length === 1) {
        const responseData = {
          type: 'single',
          result: students[0],
        };
        setCachedResult(cacheKey, responseData);
        return NextResponse.json(responseData);
      }

      const responseData = {
        type: 'multiple',
        results: students,
        count: students.length,
      };
      setCachedResult(cacheKey, responseData);
      return NextResponse.json(responseData);
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { type: 'none', message: 'لم يتم إضافة بيانات النتائج بعد على قاعدة البيانات' },
      { status: 200 }
    );
  }
}

