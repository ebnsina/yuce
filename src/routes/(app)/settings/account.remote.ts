import { error, invalid, redirect } from '@sveltejs/kit';
import { form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { user } from '#lib/server/db/schema.js';
import { endSession } from '#lib/server/auth.js';

export const deleteAccount = form(
	v.object({ handle: v.pipe(v.string(), v.trim(), v.toLowerCase()) }),
	async ({ handle }, issue) => {
		const { locals, cookies } = getRequestEvent();
		if (!locals.user) error(401, 'Sign in first.');

		// Typing the handle is the confirmation: this cannot be undone and is not queued.
		if (handle !== locals.user.handle) {
			invalid(issue.handle(`Type @${locals.user.handle} exactly to confirm.`));
		}

		await endSession(cookies);
		// Posts, replies, follows, blocks and sessions all cascade from here.
		await db.delete(user).where(eq(user.id, locals.user.id));

		redirect(303, '/');
	}
);
