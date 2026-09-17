import { error, invalid, redirect } from '@sveltejs/kit';
import { form, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { post, user } from '#lib/server/db/schema.js';

const MAX_LENGTH = 1000;
const PAGE_SIZE = 50;

/** Every remote function checks for itself: the hook guards pages, not data. */
function signedIn() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'Sign in first.');
	return locals.user;
}

export const getFeed = query(async () => {
	signedIn();

	return db
		.select({
			id: post.id,
			body: post.body,
			createdAt: post.createdAt,
			authorId: post.authorId,
			authorName: user.name,
			authorHandle: user.handle
		})
		.from(post)
		.innerJoin(user, eq(user.id, post.authorId))
		.orderBy(desc(post.createdAt))
		.limit(PAGE_SIZE);
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
		await getFeed().refresh();
		return { posted: true };
	}
);

export const deletePost = form(
	v.object({ id: v.pipe(v.string(), v.uuid()) }),
	async ({ id }, issue) => {
		const author = signedIn();

		const [row] = await db.select({ authorId: post.authorId }).from(post).where(eq(post.id, id));
		if (!row) invalid(issue.id('That post is already gone.'));
		// Ownership is checked here, not in the page: a form can be posted from anywhere.
		if (row.authorId !== author.id) error(403, 'That is not your post.');

		await db.delete(post).where(eq(post.id, id));
		await getFeed().refresh();
		redirect(303, '/home');
	}
);
