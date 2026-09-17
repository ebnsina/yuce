import { error, invalid } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { and, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { comment, post, report } from '#lib/server/db/schema.js';
import { RULES } from '#lib/rules.js';

function signedIn() {
	const { locals } = getRequestEvent();
	if (!locals.user) error(401, 'Sign in first.');
	return locals.user;
}

const ruleIds = RULES.map((r) => r.id) as unknown as [string, ...string[]];

export const reportContent = form(
	v.object({
		kind: v.picklist(['post', 'comment']),
		id: v.pipe(v.string(), v.uuid()),
		rule: v.picklist(ruleIds, 'Choose which rule this breaks.'),
		note: v.optional(
			v.pipe(v.string(), v.trim(), v.maxLength(500, 'Keep it under 500 characters.'))
		)
	}),
	async ({ kind, id, rule, note }, issue) => {
		const reporter = signedIn();

		const table = kind === 'post' ? post : comment;
		const [target] = await db.select({ id: table.id }).from(table).where(eq(table.id, id));
		if (!target) invalid(issue.id('That has already gone.'));

		// One report per person per thing: a second is not more evidence, it is noise.
		const [already] = await db
			.select({ id: report.id })
			.from(report)
			.where(
				and(
					eq(report.targetKind, kind),
					eq(report.targetId, id),
					eq(report.reporterId, reporter.id)
				)
			);
		if (already) return { reported: true };

		await db.insert(report).values({
			id: crypto.randomUUID(),
			targetKind: kind,
			targetId: id,
			reporterId: reporter.id,
			rule,
			note: note || null
		});

		return { reported: true };
	}
);
