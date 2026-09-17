import { invalid } from '@sveltejs/kit';
import { form } from '$app/server';
import * as v from 'valibot';
import { db } from '#lib/server/db/index.js';
import { waitlist } from '#lib/server/db/schema.js';

const schema = v.object({
	email: v.pipe(
		v.string(),
		v.trim(),
		v.toLowerCase(),
		v.email('That email address does not look right.'),
		v.maxLength(254, 'That email address is too long.')
	),
	city: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(80, 'That city name is too long.')))
});

export const joinWaitlist = form(schema, async ({ email, city }, issue) => {
	try {
		await db
			.insert(waitlist)
			.values({ email, city: city || null })
			.onConflictDoNothing();
	} catch {
		// The address is never lost to a stack trace the visitor cannot read.
		invalid(issue.email('We could not save that just now. Please try again in a minute.'));
	}

	return { joined: true };
});
