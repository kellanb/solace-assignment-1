import type { Advocate } from "./advocates";

const normalizeString = (value: string) =>
  value
    .normalize("NFKD")
    // Strip combining marks so diacritics (é/ñ) match ASCII equivalents.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const searchableFields = (advocate: Advocate) => [
  advocate.firstName,
  advocate.lastName,
  advocate.city,
  advocate.degree,
  String(advocate.yearsOfExperience),
  ...advocate.specialties,
];

/**
 * Filter advocates on the client. We normalize the search term and the
 * candidate fields to ensure diacritics/casing differences don't block matches.
 * This replaces the original `.includes` call on arrays/numbers that crashed
 * once a user typed anything. Once the API exposes server-side filtering,
 * this logic will help validate the SQL equivalence in unit tests.
 */
export function filterAdvocatesByTerm(
  advocates: Advocate[],
  rawTerm: string
): Advocate[] {
  const normalizedTerm = normalizeString(rawTerm);
  if (!normalizedTerm) {
    return advocates;
  }

  return advocates.filter((advocate) =>
    searchableFields(advocate)
      .map((field) => normalizeString(field))
      .some((field) => field.includes(normalizedTerm))
  );
}

export { normalizeString };
