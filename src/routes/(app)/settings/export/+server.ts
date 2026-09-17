import { error, json } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { appeal, block, comment, follow, post, report, user } from '#lib/server/db/schema.js';
import type { RequestHandler } from './$types';

/**
 * Everything held about one account, in one file, readable without this app. The
 * privacy page promises this, so it is a route rather than a support request.
 */
export const GET: RequestHandler = async ({ locals }) => {
	const me = locals.user;
	if (!me) error(401, 'Sign in first.');

	const [account] = await db
		.select({
			handle: user.handle,
			name: user.name,
			email: user.email,
			bio: user.bio,
			joinedAt: user.createdAt
		})
		.from(user)
		.where(eq(user.id, me.id));

	const data = {
		exportedAt: new Date().toISOString(),
		account,
		posts: await db
			.select({ body: post.body, writtenAt: post.createdAt, removedAt: post.removedAt })
			.from(post)
			.where(eq(post.authorId, me.id))
			.orderBy(desc(post.createdAt)),
		replies: await db
			.select({ body: comment.body, writtenAt: comment.createdAt, removedAt: comment.removedAt })
			.from(comment)
			.where(eq(comment.authorId, me.id))
			.orderBy(desc(comment.createdAt)),
		following: await db
			.select({ handle: user.handle, since: follow.createdAt })
			.from(follow)
			.innerJoin(user, eq(user.id, follow.followeeId))
			.where(eq(follow.followerId, me.id)),
		blocked: await db
			.select({ handle: user.handle, since: block.createdAt })
			.from(block)
			.innerJoin(user, eq(user.id, block.blockedId))
			.where(eq(block.blockerId, me.id)),
		reportsYouMade: await db
			.select({
				rule: report.rule,
				note: report.note,
				madeAt: report.createdAt,
				outcome: report.state
			})
			.from(report)
			.where(eq(report.reporterId, me.id)),
		appealsYouMade: await db
			.select({ note: appeal.note, madeAt: appeal.createdAt, outcome: appeal.state })
			.from(appeal)
			.where(eq(appeal.authorId, me.id))
	};

	return json(data, {
		headers: {
			'content-disposition': `attachment; filename="yuce-${account.handle}.json"`,
			'cache-control': 'private, no-store'
		}
	});
};
