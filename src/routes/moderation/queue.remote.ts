import { error, invalid } from '@sveltejs/kit';
import { form, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { comment, post, report, user } from '#lib/server/db/schema.js';
import { getComments, getFeed } from '../home/feed.remote.js';

function moderator() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'Sign in first.');
	if (!locals.user.isModerator) error(403, 'The queue is for moderators.');
	return locals.user;
}

/** Oldest first: the queue is a line, and the person waiting longest is served first. */
export const getQueue = query(async () => {
	moderator();

	const reporter = user;
	const rows = await db
		.select({
			id: report.id,
			kind: report.targetKind,
			targetId: report.targetId,
			rule: report.rule,
			note: report.note,
			createdAt: report.createdAt,
			reporterHandle: reporter.handle,
			body: sql<string | null>`coalesce(
				(select p.body from ${post} p where p.id = ${report.targetId} and ${report.targetKind} = 'post'),
				(select c.body from ${comment} c where c.id = ${report.targetId} and ${report.targetKind} = 'comment')
			)`,
			authorHandle: sql<string | null>`coalesce(
				(select u.handle from ${post} p join ${user} u on u.id = p.author_id where p.id = ${report.targetId} and ${report.targetKind} = 'post'),
				(select u.handle from ${comment} c join ${user} u on u.id = c.author_id where c.id = ${report.targetId} and ${report.targetKind} = 'comment')
			)`,
			removedAt: sql<Date | null>`coalesce(
				(select p.removed_at from ${post} p where p.id = ${report.targetId} and ${report.targetKind} = 'post'),
				(select c.removed_at from ${comment} c where c.id = ${report.targetId} and ${report.targetKind} = 'comment')
			)`
		})
		.from(report)
		.innerJoin(reporter, eq(reporter.id, report.reporterId))
		.where(eq(report.state, 'open'))
		.orderBy(report.createdAt);

	return rows;
});

/** What the policy promises to publish every month, including the ones we got wrong. */
export const getTally = query(async () => {
	moderator();

	const rows = await db
		.select({ state: report.state, n: sql<number>`count(*)::int` })
		.from(report)
		.groupBy(report.state)
		.orderBy(desc(sql`count(*)`));

	return rows;
});

export const decide = form(
	v.object({
		id: v.pipe(v.string(), v.uuid()),
		verdict: v.picklist(['removed', 'kept'])
	}),
	async ({ id, verdict }, issue) => {
		const me = moderator();

		const [row] = await db.select().from(report).where(eq(report.id, id));
		if (!row) invalid(issue.id('That report has already been settled.'));
		if (row.state !== 'open') invalid(issue.id('Somebody has already decided this one.'));

		if (verdict === 'removed') {
			const table = row.targetKind === 'post' ? post : comment;
			await db
				.update(table)
				.set({ removedAt: new Date(), removedReason: row.rule })
				.where(eq(table.id, row.targetId));
		}

		await db
			.update(report)
			.set({ state: verdict, decidedBy: me.id, decidedAt: new Date() })
			.where(eq(report.id, id));

		await getQueue().refresh();
		await getTally().refresh();
		// The feed changes for everyone when something comes down, so it is refetched.
		await getFeed().refresh();
		if (row.targetKind === 'comment') {
			const [parent] = await db
				.select({ postId: comment.postId })
				.from(comment)
				.where(eq(comment.id, row.targetId));
			if (parent) await getComments(parent.postId).refresh();
		}

		return { decided: verdict };
	}
);
