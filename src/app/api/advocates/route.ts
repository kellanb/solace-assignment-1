import { getDb } from "../../../db";
import { advocates } from "../../../db/schema";
import { advocateData } from "../../../db/seed/advocates";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // During local development we still want usable data, so fall back to the
    // deterministic seed payload while clearly stating why.
    console.info("DATABASE_URL missing; returning seeded advocate data.");
    return Response.json({ data: advocateData, source: "seed" });
  }

  try {
    const db = getDb();
    const data = await db.select().from(advocates);
    return Response.json({ data, source: "database" });
  } catch (error) {
    console.error(
      "Failed to query advocates table, falling back to seed data.",
      error
    );
    return Response.json(
      {
        data: advocateData,
        source: "seed",
        error: "database_query_failed",
      },
      { status: 200 }
    );
  }
}
