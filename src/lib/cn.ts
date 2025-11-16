/**
 * Tiny class name combiner used by the UI primitives.
 * We avoid pulling an external dep while still keeping conditional classes tidy.
 */
export function cn(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}
