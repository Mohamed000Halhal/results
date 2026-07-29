import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSeatNumber, normalizeArabic, parseArabicNumerals, buildArabicSearchClauses } from '@/lib/arabic';
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
      // 2. Exact B-Tree Index Lookup for Seat Number
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
      // 3. Smart Multi-token & Compound-aware Search for Name
      const normalizedQuery = normalizeArabic(query);
      const firstWord = normalizedQuery.split(' ')[0] || '';
      const { sqlWhere, params } = buildArabicSearchClauses(query);

      // Get total count of matching students
      const countSql = `SELECT COUNT(*) as count FROM results WHERE ${sqlWhere}`;
      const countResult = await db.$queryRawUnsafe<Array<{ count: number }>>(countSql, ...params);
      const totalCount = countResult[0]?.count || 0;

      if (totalCount === 0) {
        const responseData = {
          type: 'none',
          message: `لم يتم العثور على نتائج تطابق: "${query}"`,
        };
        setCachedResult(cacheKey, responseData);
        return NextResponse.json(responseData);
      }

      // Fetch top 50 matches ranked by prefix relevance
      const searchSql = `
        SELECT id, name, seat_number as seatNumber, result, percentage 
        FROM results 
        WHERE ${sqlWhere} 
        ORDER BY 
          CASE 
            WHEN normalized_name LIKE ? THEN 1
            WHEN normalized_name LIKE ? THEN 2
            ELSE 3
          END,
          CAST(seat_number AS INTEGER) ASC
        LIMIT 50
      `;

      const queryParams = [
        `${normalizedQuery}%`,
        `${firstWord}%`,
        ...params
      ];

      const students = await db.$queryRawUnsafe<Array<{
        id: string;
        name: string;
        seatNumber: string;
        result: string;
        percentage: number;
      }>>(searchSql, ...queryParams);

      if (students.length === 1 && totalCount === 1) {
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
        count: totalCount,
      };
      setCachedResult(cacheKey, responseData);
      return NextResponse.json(responseData);
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { type: 'none', message: 'حدث خطأ في عملية البحث أو تعذر الوصول إلى قاعدة البيانات' },
      { status: 500 }
    );
  }
}


