import { and, eq, or, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { block } from './db/schema.js';
import type { PgColumn } from 'drizzle-orm/pg-core';

/**
 * Blocking works both ways: whoever blocked whom, the two of them stop seeing each
 * other. Written once and applied to every list, because a rule enforced in three
 * places out of four is not a rule.
 */
export function notBlocked(authorId: PgColumn, meId: string) {
	return sql`not exists (
		select 1 from ${block}
		where (${block.blockerId} = ${meId} and ${block.blockedId} = ${authorId})
			or (${block.blockerId} = ${authorId} and ${block.blockedId} = ${meId})
	)`;
}

/** True when either of the two has blocked the other. */
export async function blockedBetween(a: string, b: string) {
	const [row] = await db
		.select({ one: sql`1` })
		.from(block)
		.where(
			or(
				and(eq(block.blockerId, a), eq(block.blockedId, b)),
				and(eq(block.blockerId, b), eq(block.blockedId, a))
			)
		);
	return Boolean(row);
}
