import { error, invalid } from '@sveltejs/kit';
import { form, getRequestEvent, query } from '$app/server';
import * as v from 'valibot';
import { and, desc, eq, isNotNull, or, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { appeal, comment, post, report } from '#lib/server/db/schema.js';

function signedIn() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'Sign in first.');
	return locals.user;
}

/**
 * What was taken down from this account, and where each one stands. Looking for it in
 * the feed is not being told, so it is shown at the top of the page on its own.
 */
export const getMyRemovals = query(async () => {
	const me = signedIn();

	return db
		.select({
			reportId: report.id,
			kind: report.targetKind,
			rule: report.rule,
			decidedAt: report.decidedAt,
			words: sql<string | null>`coalesce(
				(select p.body from ${post} p where p.id = ${report.targetId} and ${report.targetKind} = 'post'),
				(select c.body from ${comment} c where c.id = ${report.targetId} and ${report.targetKind} = 'comment')
			)`,
			appealState: appeal.state,
			appealNote: appeal.note
		})
		.from(report)
		.leftJoin(appeal, eq(appeal.reportId, report.id))
		.where(
			and(
				eq(report.state, 'removed'),
				isNotNull(report.decidedAt),
				// Only this account's own writing, whichever kind it was.
				or(
					sql`exists (select 1 from ${post} p where p.id = ${report.targetId} and ${report.targetKind} = 'post' and p.author_id = ${me.id})`,
					sql`exists (select 1 from ${comment} c where c.id = ${report.targetId} and ${report.targetKind} = 'comment' and c.author_id = ${me.id})`
				)
			)
		)
		.orderBy(desc(report.decidedAt));
});

const APPEAL_WINDOW_MS = 48 * 60 * 60 * 1000;

export const appealRemoval = form(
	v.object({
		reportId: v.pipe(v.string(), v.uuid()),
		note: v.pipe(
			v.string(),
			v.trim(),
			v.minLength(1, 'Tell us why, in your own words.'),
			v.maxLength(1000, 'Keep it under 1,000 characters.')
		)
	}),
	async ({ reportId, note }, issue) => {
		const me = signedIn();

		const [row] = await db.select().from(report).where(eq(report.id, reportId));
		if (!row || row.state !== 'removed' || !row.decidedAt) {
			invalid(issue.reportId('There is nothing to appeal here.'));
		}

		const mine =
			row.targetKind === 'post'
				? await db
						.select({ id: post.id })
						.from(post)
						.where(and(eq(post.id, row.targetId), eq(post.authorId, me.id)))
				: await db
						.select({ id: comment.id })
						.from(comment)
						.where(and(eq(comment.id, row.targetId), eq(comment.authorId, me.id)));
		if (!mine.length) error(403, 'That is not yours to appeal.');

		// The window is stated on the page, so it is enforced rather than implied.
		if (Date.now() - row.decidedAt.getTime() > APPEAL_WINDOW_MS) {
			invalid(issue.note('The 48 hours for appealing this one have passed.'));
		}

		const [already] = await db.select().from(appeal).where(eq(appeal.reportId, reportId));
		if (already) invalid(issue.note('You have already appealed this. One level, one appeal.'));

		await db.insert(appeal).values({ id: crypto.randomUUID(), reportId, authorId: me.id, note });

		await getMyRemovals().refresh();
		return { appealed: true };
	}
);
