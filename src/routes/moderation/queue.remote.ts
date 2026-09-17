import { error, invalid } from '@sveltejs/kit';
import { form, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { appeal, comment, post, report, user } from '#lib/server/db/schema.js';
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

/** Appeals are a second queue, read by a person who did not make the first decision. */
export const getAppeals = query(async () => {
	moderator();

	const author = user;
	return db
		.select({
			id: appeal.id,
			note: appeal.note,
			createdAt: appeal.createdAt,
			rule: report.rule,
			kind: report.targetKind,
			decidedBy: report.decidedBy,
			authorHandle: author.handle,
			words: sql<string | null>`coalesce(
				(select p.body from ${post} p where p.id = ${report.targetId} and ${report.targetKind} = 'post'),
				(select c.body from ${comment} c where c.id = ${report.targetId} and ${report.targetKind} = 'comment')
			)`
		})
		.from(appeal)
		.innerJoin(report, eq(report.id, appeal.reportId))
		.innerJoin(author, eq(author.id, appeal.authorId))
		.where(eq(appeal.state, 'open'))
		.orderBy(appeal.createdAt);
});

export const settleAppeal = form(
	v.object({
		id: v.pipe(v.string(), v.uuid()),
		verdict: v.picklist(['overturned', 'upheld'])
	}),
	async ({ id, verdict }, issue) => {
		const me = moderator();

		const [row] = await db
			.select({ appeal, report })
			.from(appeal)
			.innerJoin(report, eq(report.id, appeal.reportId))
			.where(eq(appeal.id, id));
		if (!row || row.appeal.state !== 'open') {
			invalid(issue.id('That appeal has already been settled.'));
		}
		// Whoever removed it does not get to judge the objection to their own decision.
		if (row.report.decidedBy === me.id) {
			invalid(issue.id('You made this removal, so somebody else has to read the appeal.'));
		}

		if (verdict === 'overturned') {
			const table = row.report.targetKind === 'post' ? post : comment;
			await db
				.update(table)
				.set({ removedAt: null, removedReason: null })
				.where(eq(table.id, row.report.targetId));
			await db.update(report).set({ state: 'kept' }).where(eq(report.id, row.report.id));
		}

		await db
			.update(appeal)
			.set({ state: verdict, decidedBy: me.id, decidedAt: new Date() })
			.where(eq(appeal.id, id));

		await getAppeals().refresh();
		await getTally().refresh();
		await getFeed().refresh();
		return { settled: verdict };
	}
);
