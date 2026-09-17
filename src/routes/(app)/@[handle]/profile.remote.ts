import { error } from '@sveltejs/kit';
import { command, form, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { and, desc, eq, exists, isNull, or, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { block, follow, post, user } from '#lib/server/db/schema.js';
import { blockedBetween } from '#lib/server/visibility.js';
import { getFeed } from '../home/feed.remote.js';

function signedIn() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'Sign in first.');
	return locals.user;
}

const handle = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.maxLength(30));

export const getProfile = query(handle, async (name) => {
	const me = signedIn();

	const [person] = await db
		.select({
			id: user.id,
			handle: user.handle,
			name: user.name,
			bio: user.bio,
			joinedAt: user.createdAt,
			// `$count`, not a hand-written subquery: with no join in the outer query
			// drizzle renders bare column names, and `"id"` then binds to the inner
			// table — every count came back zero because each row was compared to itself.
			followers: db.$count(follow, eq(follow.followeeId, user.id)),
			following: db.$count(follow, eq(follow.followerId, user.id)),
			posts: db.$count(post, and(eq(post.authorId, user.id), isNull(post.removedAt))),
			followed: exists(
				db
					.select({ one: sql`1` })
					.from(follow)
					.where(and(eq(follow.followerId, me.id), eq(follow.followeeId, user.id)))
			)
		})
		.from(user)
		.where(eq(user.handle, name));

	if (!person) error(404, 'Nobody here by that name.');

	const [blocked] = await db
		.select({ one: sql`1` })
		.from(block)
		.where(and(eq(block.blockerId, me.id), eq(block.blockedId, person.id)));

	return {
		...person,
		isMe: person.id === me.id,
		blocked: Boolean(blocked),
		// Their writing is hidden either way round, so the page says so either way round.
		hidden: person.id !== me.id && (await blockedBetween(me.id, person.id))
	};
});

export const getPostsBy = query(handle, async (name) => {
	const me = signedIn();

	const [them] = await db.select({ id: user.id }).from(user).where(eq(user.handle, name));
	if (!them) error(404, 'Nobody here by that name.');
	if (them.id !== me.id && (await blockedBetween(me.id, them.id))) return [];

	return db
		.select({
			id: post.id,
			body: sql<string | null>`case when ${post.removedAt} is null then ${post.body} end`,
			removedReason: post.removedReason,
			createdAt: post.createdAt
		})
		.from(post)
		.innerJoin(user, eq(user.id, post.authorId))
		.where(eq(user.handle, name))
		.orderBy(desc(post.createdAt))
		.limit(50);
});

export const toggleFollow = command(handle, async (name) => {
	const me = signedIn();

	const [them] = await db.select({ id: user.id }).from(user).where(eq(user.handle, name));
	if (!them) error(404, 'Nobody here by that name.');
	if (them.id === me.id) error(400, 'You cannot follow yourself.');
	if (await blockedBetween(me.id, them.id)) error(403, 'There is a block between you.');

	const [already] = await db
		.select({ one: sql`1` })
		.from(follow)
		.where(and(eq(follow.followerId, me.id), eq(follow.followeeId, them.id)));

	if (already) {
		await db
			.delete(follow)
			.where(and(eq(follow.followerId, me.id), eq(follow.followeeId, them.id)));
	} else {
		await db.insert(follow).values({ followerId: me.id, followeeId: them.id });
	}

	await getProfile(name).refresh();
	// Following changes what the following feed contains, so it comes back too.
	await getFeed('following').refresh();
	await getFeed('everyone').refresh();
	return { following: !already };
});

export const saveProfile = form(
	v.object({
		name: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, 'A name is how people know you.'),
			v.maxLength(60, 'Keep it under 60 characters.')
		),
		bio: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(280, 'Keep it under 280 characters.')))
	}),
	async ({ name, bio }) => {
		const me = signedIn();
		await db
			.update(user)
			.set({ name, bio: bio || null })
			.where(eq(user.id, me.id));

		await getProfile(me.handle).refresh();
		await getFeed('following').refresh();
		await getFeed('everyone').refresh();
		return { saved: true };
	}
);

/** Blocking removes the follow in both directions: a door shut is a door shut. */
export const toggleBlock = command(handle, async (name) => {
	const me = signedIn();

	const [them] = await db.select({ id: user.id }).from(user).where(eq(user.handle, name));
	if (!them) error(404, 'Nobody here by that name.');
	if (them.id === me.id) error(400, 'You cannot block yourself.');

	const [already] = await db
		.select({ one: sql`1` })
		.from(block)
		.where(and(eq(block.blockerId, me.id), eq(block.blockedId, them.id)));

	if (already) {
		await db.delete(block).where(and(eq(block.blockerId, me.id), eq(block.blockedId, them.id)));
	} else {
		await db.insert(block).values({ blockerId: me.id, blockedId: them.id });
		await db
			.delete(follow)
			.where(
				or(
					and(eq(follow.followerId, me.id), eq(follow.followeeId, them.id)),
					and(eq(follow.followerId, them.id), eq(follow.followeeId, me.id))
				)
			);
	}

	await getProfile(name).refresh();
	await getPostsBy(name).refresh();
	await getFeed('following').refresh();
	await getFeed('everyone').refresh();
	return { blocked: !already };
});
