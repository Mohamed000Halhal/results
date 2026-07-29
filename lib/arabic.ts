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
