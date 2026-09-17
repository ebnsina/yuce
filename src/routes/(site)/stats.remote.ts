import { query } from '$app/server';
import { sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { waitlist } from '#lib/server/db/schema.js';

/** The only number on the page, and it is the real one. */
export const waitingCount = query(async () => {
	const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(waitlist);
	return row?.n ?? 0;
});
