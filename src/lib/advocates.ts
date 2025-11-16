export type Advocate = {
  id?: number;
  firstName: string;
  lastName: string;
  city: string;
  degree: string;
  specialties: string[];
  yearsOfExperience: number;
  phoneNumber: number;
};

type AdvocateResponse = {
  data: Advocate[];
};

/**
 * Shared fetch helper so components can keep the data contract in sync with the API.
 * Centralizing this logic makes it easier to add caching/error policies later.
 */
export async function fetchAdvocates(signal?: AbortSignal): Promise<Advocate[]> {
  const response = await fetch("/api/advocates", { signal });

  if (!response.ok) {
    throw new Error(`Failed to load advocates. Status: ${response.status}`);
  }

  const payload = (await response.json()) as AdvocateResponse;
  return payload?.data ?? [];
}
