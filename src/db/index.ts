import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Next.js' hot-reload spawns many module instances, so we memoize the Drizzle
// client on the global object in development to avoid exhausting database
// connections and to keep logging consistent between requests.
const globalForDb = globalThis as typeof globalThis & {
  drizzleDb?: ReturnType<typeof drizzle>;
};

function createDbClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Configure it to enable database access."
    );
  }

  const queryClient = postgres(connectionString);
  return drizzle(queryClient);
}

export function getDb() {
  if (globalForDb.drizzleDb) {
    return globalForDb.drizzleDb;
  }

  const db = createDbClient();

  if (process.env.NODE_ENV !== "production") {
    // Only cache the db client locally in dev—serverless deployments expect
    // fresh connections on each invocation.
    globalForDb.drizzleDb = db;
  }

  return db;
}
