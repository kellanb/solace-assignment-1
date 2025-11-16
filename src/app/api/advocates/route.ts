import { and, asc, count, desc, gte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { getDb } from "../../../db";
import { advocates } from "../../../db/schema";
import { advocateData } from "../../../db/seed/advocates";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

type QueryFilters = {
  q: string;
  city: string | null;
  specialties: string[];
  minExperience: number;
  sort: "name" | "experience";
  page: number;
  pageSize: number;
};

const toNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseSpecialties = (value: string | null) => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
};

const buildWhereClause = (filters: QueryFilters) => {
  const conditions: SQL<unknown>[] = [];

  if (filters.q) {
    const likeQuery = `%${filters.q}%`;
    conditions.push(
      sql`(${advocates.firstName} ILIKE ${likeQuery} OR ${advocates.lastName} ILIKE ${likeQuery} OR ${advocates.city} ILIKE ${likeQuery} OR ${advocates.degree} ILIKE ${likeQuery})`
    );
  }

  if (filters.city && filters.city !== "all") {
    conditions.push(sql`${advocates.city} = ${filters.city}`);
  }

  if (filters.specialties.length > 0) {
    const jsonArray = JSON.stringify(filters.specialties);
    conditions.push(sql`${advocates.specialties} @> ${jsonArray}::jsonb`);
  }

  if (filters.minExperience > 0) {
    conditions.push(gte(advocates.yearsOfExperience, filters.minExperience));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
};

const filterSeedData = (filters: QueryFilters) => {
  const query = filters.q.toLowerCase();

  const filtered = advocateData.filter((advocate) => {
    const matchesQuery =
      !query ||
      [
        advocate.firstName,
        advocate.lastName,
        advocate.city,
        advocate.degree,
        advocate.specialties.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesCity =
      !filters.city ||
      filters.city === "all" ||
      advocate.city === filters.city;

    const matchesSpecialties =
      filters.specialties.length === 0 ||
      filters.specialties.every((specialty) =>
        advocate.specialties.includes(specialty)
      );

    const matchesExperience =
      advocate.yearsOfExperience >= filters.minExperience;

    return (
      matchesQuery && matchesCity && matchesSpecialties && matchesExperience
    );
  });

  const ordered = [...filtered].sort((a, b) => {
    if (filters.sort === "experience") {
      return b.yearsOfExperience - a.yearsOfExperience;
    }

    const lastNameCompare = a.lastName.localeCompare(b.lastName);
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.firstName.localeCompare(b.firstName);
  });

  const offset = (filters.page - 1) * filters.pageSize;
  const paged = ordered.slice(offset, offset + filters.pageSize);

  return {
    data: paged,
    total: filtered.length,
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const filters: QueryFilters = {
    q: searchParams.get("q")?.trim().toLowerCase() ?? "",
    city: searchParams.get("city"),
    specialties: parseSpecialties(searchParams.get("specialties")),
    minExperience: toNumber(searchParams.get("minExperience"), 0),
    sort: searchParams.get("sort") === "experience" ? "experience" : "name",
    page: Math.max(toNumber(searchParams.get("page"), DEFAULT_PAGE), 1),
    pageSize: Math.min(
      Math.max(toNumber(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE), 1),
      MAX_PAGE_SIZE
    ),
  };

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.info("DATABASE_URL missing; returning seeded advocate data.");
    const { data, total } = filterSeedData(filters);

    return Response.json(
      {
        data,
        meta: {
          page: filters.page,
          pageSize: filters.pageSize,
          total,
          hasNextPage: filters.page * filters.pageSize < total,
          source: "seed",
        },
      },
      {
        headers: {
          "X-Request-Duration": "seed",
        },
      }
    );
  }

  try {
    const db = getDb();
    const whereClause = buildWhereClause(filters);
    const offset = (filters.page - 1) * filters.pageSize;
    const orderBy =
      filters.sort === "experience"
        ? [desc(advocates.yearsOfExperience), asc(advocates.lastName)]
        : [asc(advocates.lastName), asc(advocates.firstName)];

    const queryStart = performance.now();

    const [rows, totalCount] = await Promise.all([
      (whereClause
        ? db
            .select()
            .from(advocates)
            .where(whereClause)
            .orderBy(...orderBy)
            .limit(filters.pageSize)
            .offset(offset)
        : db
            .select()
            .from(advocates)
            .orderBy(...orderBy)
            .limit(filters.pageSize)
            .offset(offset)),
      (whereClause
        ? db.select({ value: count() }).from(advocates).where(whereClause)
        : db.select({ value: count() }).from(advocates)),
    ]);

    const durationMs = performance.now() - queryStart;
    const total = Number(totalCount[0]?.value ?? 0);

    return Response.json(
      {
        data: rows,
        meta: {
          page: filters.page,
          pageSize: filters.pageSize,
          total,
          hasNextPage: filters.page * filters.pageSize < total,
          source: "database",
          durationMs,
        },
      },
      {
        headers: {
          "X-Request-Duration": `${durationMs.toFixed(2)}ms`,
        },
      }
    );
  } catch (error) {
    console.error("Failed to query advocates table.", error);
    return Response.json(
      {
        error: "database_query_failed",
        message: "Failed to query advocates table. Check server logs.",
      },
      { status: 500 }
    );
  }
}
