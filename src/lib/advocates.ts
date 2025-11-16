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

export type AdvocateResponse = {
  data: Advocate[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
    source: "database" | "seed";
    durationMs?: number;
  };
};

export type AdvocateQueryParams = {
  q?: string;
  city?: string | null;
  specialties?: string[];
  minExperience?: number;
  sort?: "name" | "experience";
  page?: number;
  pageSize?: number;
};

const toQueryString = (params: AdvocateQueryParams) => {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.city) search.set("city", params.city);
  if (params.specialties && params.specialties.length > 0) {
    search.set("specialties", params.specialties.join(","));
  }
  if (typeof params.minExperience === "number") {
    search.set("minExperience", params.minExperience.toString());
  }
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", params.page.toString());
  if (params.pageSize) search.set("pageSize", params.pageSize.toString());

  return search.toString();
};

/**
 * Fetch a page of advocates using the paginated Next.js API.
 */
export async function fetchAdvocatesPage(
  params: AdvocateQueryParams,
  signal?: AbortSignal
): Promise<AdvocateResponse> {
  const queryString = toQueryString(params);
  const url = queryString ? `/api/advocates?${queryString}` : "/api/advocates";

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load advocates. Status: ${response.status}`);
  }

  return (await response.json()) as AdvocateResponse;
}
