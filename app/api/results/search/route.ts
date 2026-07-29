import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isSeatNumber, normalizeArabic, parseArabicNumerals } from '@/lib/arabic';
import { checkRateLimit } from '@/lib/rateLimit';

// Ultra-fast In-memory LRU Cache for 0ms instant responses
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

function getRangeUpperBound(term: string): string {
  if (!term) return '';
  const lastChar = term.slice(-1);
  const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
  return term.slice(0, -1) + nextChar;
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
      // 3. Fast Student-Name Focused Search (Prioritizes student's name / first name)
      const normalizedQuery = normalizeArabic(query);
      const tokens = normalizedQuery.split(' ').filter(Boolean);

      if (tokens.length === 0) {
        return NextResponse.json({ type: 'none', message: 'يرجى إدخال كلمة بحث صحيحة' });
      }

      const firstWord = tokens[0];
      const rangeUpper = getRangeUpperBound(normalizedQuery);

      // Phase 1: Fast B-Tree Index Range Search (Student's name starts with full query)
      let students = await db.studentResult.findMany({
        where: {
          normalizedName: {
            gte: normalizedQuery,
            lt: rangeUpper,
          },
        },
        select: {
          id: true,
          name: true,
          seatNumber: true,
          result: true,
          percentage: true,
        },
        take: 50,
      });

      // Phase 2: If < 30 results and multi-word query, search for student's first name starting with firstWord + remaining words anywhere
      if (students.length < 30 && tokens.length > 1) {
        const firstWordUpper = getRangeUpperBound(firstWord);
        const existingIds = new Set(students.map(s => s.id));
        const otherTokens = tokens.slice(1);

        const phase2Students = await db.studentResult.findMany({
          where: {
            normalizedName: {
              gte: firstWord,
              lt: firstWordUpper,
            },
            AND: otherTokens.map(t => ({
              normalizedName: { contains: t },
            })),
          },
          select: {
            id: true,
            name: true,
            seatNumber: true,
            result: true,
            percentage: true,
          },
          take: 50,
        });

        for (const s of phase2Students) {
          if (!existingIds.has(s.id)) {
            students.push(s);
            existingIds.add(s.id);
            if (students.length >= 50) break;
          }
        }
      }

      // Phase 3: Fallback if still 0 results (contains tokens anywhere)
      if (students.length === 0) {
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

        students = await db.studentResult.findMany({
          where: { AND: conditions },
          select: {
            id: true,
            name: true,
            seatNumber: true,
            result: true,
            percentage: true,
          },
          take: 50,
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
      { type: 'none', message: 'حدث خطأ في عملية البحث أو تعذر الوصول إلى قاعدة البيانات' },
      { status: 500 }
    );
  }
}
