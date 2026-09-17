import { error, invalid } from '@sveltejs/kit';
import { form, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { and, asc, desc, eq, exists, or, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { comment, follow, post, user } from '#lib/server/db/schema.js';
import { notBlocked } from '#lib/server/visibility.js';

const MAX_LENGTH = 1000;
const MAX_COMMENT = 500;
const PAGE_SIZE = 50;

/** Every remote function checks for itself: the hook guards pages, not data. */
function signedIn() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'Sign in first.');
	return locals.user;
}

const id = v.pipe(v.string(), v.uuid());

/**
 * Two lists, one query. "Following" is the feed the product promises; "everyone" is
 * how anybody finds a first person to follow, which a following-only feed cannot do.
 */
export const getFeed = query(v.picklist(['following', 'everyone']), async (scope) => {
	const me = signedIn();

	const mine = or(
		eq(post.authorId, me.id),
		exists(
			db
				.select({ one: sql`1` })
				.from(follow)
				.where(and(eq(follow.followerId, me.id), eq(follow.followeeId, post.authorId)))
		)
	);

	return db
		.select({
			id: post.id,
			// A removed post keeps its place and loses its words: the thread above and
			// below it still makes sense, and nobody reads what a moderator took down.
			body: sql<string | null>`case when ${post.removedAt} is null then ${post.body} end`,
			removedReason: post.removedReason,
			createdAt: post.createdAt,
			authorId: post.authorId,
			authorName: user.name,
			authorHandle: user.handle,
			replies: sql<number>`(select count(*)::int from ${comment} where ${comment.postId} = ${post.id} and ${comment.removedAt} is null)`
		})
		.from(post)
		.innerJoin(user, eq(user.id, post.authorId))
		.where(
			scope === 'following'
				? and(mine, notBlocked(post.authorId, me.id))
				: notBlocked(post.authorId, me.id)
		)
		.orderBy(desc(post.createdAt))
		.limit(PAGE_SIZE);
});

/** Oldest first: a conversation reads downward, unlike the feed it hangs off. */
export const getComments = query(id, async (postId) => {
	const me = signedIn();

	return db
		.select({
			id: comment.id,
			body: sql<string | null>`case when ${comment.removedAt} is null then ${comment.body} end`,
			removedReason: comment.removedReason,
			createdAt: comment.createdAt,
			authorId: comment.authorId,
			authorName: user.name,
			authorHandle: user.handle
		})
		.from(comment)
		.innerJoin(user, eq(user.id, comment.authorId))
		.where(and(eq(comment.postId, postId), notBlocked(comment.authorId, me.id)))
		.orderBy(asc(comment.createdAt));
});

export const createPost = form(
	v.object({
		body: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, 'Write something first.'),
			v.maxLength(MAX_LENGTH, `That is longer than ${MAX_LENGTH} characters.`)
		)
	}),
	async ({ body }) => {
		const author = signedIn();
		await db.insert(post).values({ id: crypto.randomUUID(), authorId: author.id, body });

		// Send the new list back with this response rather than in a second round trip.
		await getFeed('following').refresh();
		await getFeed('everyone').refresh();
		return { posted: true };
	}
);

export const deletePost = form(v.object({ id }), async ({ id }, issue) => {
	const author = signedIn();

	const [row] = await db.select({ authorId: post.authorId }).from(post).where(eq(post.id, id));
	if (!row) invalid(issue.id('That post is already gone.'));
	// Ownership is checked here, not in the page: a form can be posted from anywhere.
	if (row.authorId !== author.id) error(403, 'That is not your post.');

	await db.delete(post).where(eq(post.id, id));
	await getFeed('following').refresh();
	await getFeed('everyone').refresh();
	return { deleted: true };
});

export const addComment = form(
	v.object({
		postId: id,
		body: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, 'Write something first.'),
			v.maxLength(MAX_COMMENT, `Replies stop at ${MAX_COMMENT} characters.`)
		)
	}),
	async ({ postId, body }, issue) => {
		const author = signedIn();

		const [parent] = await db.select({ id: post.id }).from(post).where(eq(post.id, postId));
		if (!parent) invalid(issue.postId('That post is gone.'));

		await db.insert(comment).values({ id: crypto.randomUUID(), postId, authorId: author.id, body });

		// The thread and the reply count on the post both change, so both come back.
		await getComments(postId).refresh();
		await getFeed('following').refresh();
		return { added: true };
	}
);

export const deleteComment = form(v.object({ id }), async ({ id }, issue) => {
	const author = signedIn();

	const [row] = await db
		.select({ authorId: comment.authorId, postId: comment.postId })
		.from(comment)
		.where(eq(comment.id, id));
	if (!row) invalid(issue.id('That reply is already gone.'));
	if (row.authorId !== author.id) error(403, 'That is not your reply.');

	await db.delete(comment).where(eq(comment.id, id));
	await getComments(row.postId).refresh();
	await getFeed('following').refresh();
	await getFeed('everyone').refresh();
	return { deleted: true };
});
