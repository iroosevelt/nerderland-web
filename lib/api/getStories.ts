// lib/api/getStories.ts
import { db } from "@db";
import { stories } from "@db/schema";

export async function getStories() {
  return await db.select().from(stories).orderBy(stories.created_at);
}
