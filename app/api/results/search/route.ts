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
      // 2. Exact Index Lookup for Seat Number
      const seat = parseArabicNumerals(query);
      
      const student = await db.studentResult.findFirst({
        where: { seatNumber: seat },
        select: {
          id: true,
          name: true,
          seatNumber: true,
          result: true,
          percentage: true,
        },
      });

      if (!student) {
        const responseData = {
          type: 'none',
          message: `لم يتم العثور على طالب برقم الجلوس: ${seat}`,
        };
        setCachedResult(cacheKey, responseData);
        return NextResponse.json(responseData);
      }

      const responseData = {
        type: 'single',
        result: student,
      };
      setCachedResult(cacheKey, responseData);
      return NextResponse.json(responseData);

    } else {
      // 3. Flexible Multi-Token Name Search (searches first name, father name, family name)
      const normalizedQuery = normalizeArabic(query);
      const tokens = normalizedQuery.split(' ').filter(Boolean);

      if (tokens.length === 0) {
        return NextResponse.json({ type: 'none', message: 'يرجى إدخال كلمة بحث صحيحة' });
      }

      // Build AND conditions for all search tokens
      const conditions: any[] = [];
      let i = 0;
      while (i < tokens.length) {
        const token = tokens[i];
        if (token === 'عبد' && i + 1 < tokens.length) {
          const nextToken = tokens[i + 1];
          conditions.push({
            OR: [
              { normalizedName: { contains: `عبد${nextToken}` } },
              { normalizedName: { contains: `عبد ${nextToken}` } },
            ],
          });
          i += 2;
        } else if (token === 'ابو' && i + 1 < tokens.length) {
          const nextToken = tokens[i + 1];
          conditions.push({
            OR: [
              { normalizedName: { contains: `ابو${nextToken}` } },
              { normalizedName: { contains: `ابو ${nextToken}` } },
            ],
          });
          i += 2;
        } else {
          conditions.push({
            normalizedName: { contains: token },
          });
          i += 1;
        }
      }

      // Query database for count and matching records
      let totalCount = await db.studentResult.count({
        where: { AND: conditions },
      });

      let students = await db.studentResult.findMany({
        where: { AND: conditions },
        select: {
          id: true,
          name: true,
          seatNumber: true,
          result: true,
          percentage: true,
          normalizedName: true,
        },
        take: 100,
      });

      // If no exact match across all tokens, fallback to matching first 2 tokens
      if (students.length === 0 && conditions.length > 1) {
        const fallbackConditions = conditions.slice(0, 2);
        totalCount = await db.studentResult.count({
          where: { AND: fallbackConditions },
        });

        students = await db.studentResult.findMany({
          where: { AND: fallbackConditions },
          select: {
            id: true,
            name: true,
            seatNumber: true,
            result: true,
            percentage: true,
            normalizedName: true,
          },
          take: 100,
        });
      }

      if (students.length === 0) {
        const responseData = {
          type: 'none',
          message: `لم يتم العثور على نتائج تطابق: "${query}"`,
        };
        setCachedResult(cacheKey, responseData);
        return NextResponse.json(responseData);
      }

      // Relevance ranking: prefix matches first, then exact sequence matches, then others
      const firstToken = tokens[0] || '';
      const formattedStudents = students
        .map(s => {
          let rank = 3;
          if (s.normalizedName.startsWith(normalizedQuery)) {
            rank = 1;
          } else if (s.normalizedName.startsWith(firstToken)) {
            rank = 2;
          }
          return {
            id: s.id,
            name: s.name,
            seatNumber: s.seatNumber,
            result: s.result,
            percentage: s.percentage,
            rank,
          };
        })
        .sort((a, b) => a.rank - b.rank || Number(a.seatNumber) - Number(b.seatNumber))
        .slice(0, 50)
        .map(({ rank, ...rest }) => rest);

      if (formattedStudents.length === 1 && totalCount === 1) {
        const responseData = {
          type: 'single',
          result: formattedStudents[0],
        };
        setCachedResult(cacheKey, responseData);
        return NextResponse.json(responseData);
      }

      const responseData = {
        type: 'multiple',
        results: formattedStudents,
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


