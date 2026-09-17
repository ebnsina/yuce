import { error } from '@sveltejs/kit';
import { getRequestEvent, query } from '$app/server';
import { and, desc, eq, isNull, ne, notExists, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { follow, post, user } from '#lib/server/db/schema.js';

/**
 * People who have written something and that you do not already follow, newest first.
 * No scoring and no "because you liked" — the ordering is arrival, like everything else.
 */
export const whoToFollow = query(async () => {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'Sign in first.');
	const me = locals.user;

	return db
		.select({
			handle: user.handle,
			name: user.name,
			bio: user.bio,
			posts: db.$count(post, and(eq(post.authorId, user.id), isNull(post.removedAt)))
		})
		.from(user)
		.where(
			and(
				ne(user.id, me.id),
				notExists(
					db
						.select({ one: sql`1` })
						.from(follow)
						.where(and(eq(follow.followerId, me.id), eq(follow.followeeId, user.id)))
				)
			)
		)
		.orderBy(desc(user.createdAt))
		.limit(3);
});
