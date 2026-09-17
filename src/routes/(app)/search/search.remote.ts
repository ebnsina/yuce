import { error } from '@sveltejs/kit';
import { getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { comment, post, postLike, user } from '#lib/server/db/schema.js';
import { notBlocked } from '#lib/server/visibility.js';

function signedIn() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'Sign in first.');
	return locals.user;
}

const term = v.pipe(v.string(), v.trim(), v.maxLength(80));

/**
 * `ilike` on two columns. At this size a trigram index or full-text search would be
 * machinery for a problem nobody has yet; when a query starts costing something, the
 * fix is an index, not a search service.
 */
export const findPeople = query(term, async (text) => {
	const me = signedIn();
	if (text.length < 2) return [];

	const like = `%${text}%`;
	return db
		.select({
			handle: user.handle,
			name: user.name,
			bio: user.bio,
			posts: db.$count(post, and(eq(post.authorId, user.id), isNull(post.removedAt)))
		})
		.from(user)
		.where(and(or(ilike(user.handle, like), ilike(user.name, like)), notBlocked(user.id, me.id)))
		.orderBy(user.handle)
		.limit(20);
});

export const findPosts = query(term, async (text) => {
	const me = signedIn();
	if (text.length < 2) return [];

	return db
		.select({
			id: post.id,
			body: post.body,
			createdAt: post.createdAt,
			authorName: user.name,
			authorHandle: user.handle,
			replies: db.$count(comment, and(eq(comment.postId, post.id), isNull(comment.removedAt))),
			likes: db.$count(postLike, eq(postLike.postId, post.id))
		})
		.from(post)
		.innerJoin(user, eq(user.id, post.authorId))
		.where(
			and(
				ilike(post.body, `%${text}%`),
				// A removed post is not findable: it lost its words everywhere else too.
				isNull(post.removedAt),
				notBlocked(post.authorId, me.id)
			)
		)
		.orderBy(desc(post.createdAt))
		.limit(30);
});

/** What the search box offers before anyone types: the newest voices, not a ranking. */
export const recentVoices = query(async () => {
	const me = signedIn();

	return db
		.select({ handle: user.handle, name: user.name })
		.from(user)
		.where(and(notBlocked(user.id, me.id), sql`${user.id} <> ${me.id}`))
		.orderBy(desc(user.createdAt))
		.limit(5);
});
