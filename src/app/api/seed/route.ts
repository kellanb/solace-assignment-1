import { getDb } from "../../../db";
import { advocates } from "../../../db/schema";
import { advocateData } from "../../../db/seed/advocates";

export async function POST() {
  try {
    const db = getDb();
    const records = await db.insert(advocates).values(advocateData).returning();

    return Response.json({ advocates: records });
  } catch (error) {
    // Surfacing a 500 keeps the CLI user aware that the DB credentials are
    // missing or incorrect rather than silently pretending the seed worked.
    console.error("Failed to seed advocates table.", error);
    return Response.json(
      { error: "Failed to seed advocates table. Check server logs for details." },
      { status: 500 }
    );
  }
}
