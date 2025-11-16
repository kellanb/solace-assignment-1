import { useEffect, useState } from "react";

/**
 * Client-side debounce helper so we only run expensive filters/network requests
 * after the user stops typing. Keeping this its own hook allows future reuse
 * when we add server-side querying.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}
