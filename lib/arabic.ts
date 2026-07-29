/**
 * Utilities for Arabic text normalization and pattern matching.
 */

// Converts Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) to Western (0123456789)
export function parseArabicNumerals(str: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => arabicNumerals.indexOf(w).toString());
}

/**
 * Normalizes Arabic text for flexible and accurate search.
 * Converts letter variants (e.g., أ/إ/آ -> ا, ة -> ه, ى -> ي),
 * strips diacritics (tashkeel), tatweel, and collapses whitespace.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  let normalized = text.toString();

  // Strip UTF-8 BOM, zero-width spaces, and non-printable characters
  normalized = normalized.replace(/[\uFEFF\uFFFE\u200B-\u200D]/g, '');

  // Convert Eastern Arabic numerals to Western
  normalized = parseArabicNumerals(normalized);

  // Normalize Alef variants
  normalized = normalized.replace(/[أإآٱ]/g, 'ا');

  // Normalize Taa Marbouta
  normalized = normalized.replace(/ة/g, 'ه');

  // Normalize Yaa / Alef Maqsura
  normalized = normalized.replace(/ى/g, 'ي');

  // Remove Tashkeel (diacritics)
  normalized = normalized.replace(/[\u064B-\u0652\u0670]/g, '');

  // Remove Tatweel (Kashida)
  normalized = normalized.replace(/\u0640/g, '');

  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized.toLowerCase();
}

/**
 * Determines whether a search query is likely a seat number or a student name.
 */
export function isSeatNumber(query: string): boolean {
  const cleaned = parseArabicNumerals(query.trim());
  return /^\d+$/.test(cleaned);
}

export interface SearchClause {
  sqlWhere: string;
  params: any[];
}

/**
 * Builds tokenized SQL WHERE clauses supporting multi-word searches
 * and Arabic compound name expansions (e.g., عبدالله <-> عبد الله, ابوبكر <-> ابو بكر).
 */
export function buildArabicSearchClauses(query: string): SearchClause {
  const normalized = normalizeArabic(query);
  const tokens = normalized.split(' ').filter(Boolean);

  if (tokens.length === 0) {
    return { sqlWhere: '1=1', params: [] };
  }

  const clauses: string[] = [];
  const params: any[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Compound 'عبد' prefix handling (e.g. 'عبد' + 'الله' OR 'عبدالله')
    if (token === 'عبد' && i + 1 < tokens.length) {
      const nextToken = tokens[i + 1];
      clauses.push('(normalized_name LIKE ? OR normalized_name LIKE ?)');
      params.push(`%عبد${nextToken}%`, `%عبد ${nextToken}%`);
      i += 2;
    } else if (token.startsWith('عبد') && token.length > 4) {
      const rest = token.substring(3);
      clauses.push('(normalized_name LIKE ? OR normalized_name LIKE ?)');
      params.push(`%${token}%`, `%عبد ${rest}%`);
      i += 1;
    }
    // Compound 'ابو' prefix handling (e.g. 'ابو' + 'بكر' OR 'ابوبكر')
    else if (token === 'ابو' && i + 1 < tokens.length) {
      const nextToken = tokens[i + 1];
      clauses.push('(normalized_name LIKE ? OR normalized_name LIKE ?)');
      params.push(`%ابو${nextToken}%`, `%ابو ${nextToken}%`);
      i += 2;
    } else if (token.startsWith('ابو') && token.length > 4) {
      const rest = token.substring(3);
      clauses.push('(normalized_name LIKE ? OR normalized_name LIKE ?)');
      params.push(`%${token}%`, `%ابو ${rest}%`);
      i += 1;
    }
    // Standard token match
    else {
      clauses.push('normalized_name LIKE ?');
      params.push(`%${token}%`);
      i += 1;
    }
  }

  return {
    sqlWhere: clauses.join(' AND '),
    params,
  };
}

