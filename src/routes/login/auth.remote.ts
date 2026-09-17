import { invalid, redirect } from '@sveltejs/kit';
import { command, form, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import {
	checkLoginCode,
	endSession,
	issueLoginCode,
	startSession,
	sweepExpired
} from '#lib/server/auth.js';
import { sendLoginCode } from '#lib/server/email.js';

const email = v.pipe(
	v.string(),
	v.trim(),
	v.toLowerCase(),
	v.email('That email address does not look right.'),
	v.maxLength(254, 'That email address is too long.')
);

// Only same-site paths: an open redirect turns a login page into a phishing tool.
const next = v.optional(
	v.pipe(
		v.string(),
		v.transform((value) => (value.startsWith('/') && !value.startsWith('//') ? value : '/home'))
	),
	'/home'
);

export const requestCode = form(v.object({ email, next }), async ({ email }, issue) => {
	await sweepExpired();

	const issued = await issueLoginCode(email);
	if (!issued.sent) {
		invalid(issue.email('A code is already on its way. Give it a minute, then ask again.'));
	}

	try {
		await sendLoginCode(email, issued.code);
	} catch {
		invalid(issue.email('We could not send the code just now. Please try again in a minute.'));
	}

	// Dev has no mail provider, so the code is handed back to the page as well as the
	// terminal. import.meta.env.DEV is replaced at build time, so this cannot ship.
	return { sent: true, email, devCode: import.meta.env.DEV ? issued.code : undefined };
});

export const verifyCode = form(
	v.object({
		email,
		next,
		code: v.pipe(v.string(), v.trim(), v.regex(/^\d{6}$/, 'The code is six digits.'))
	}),
	async ({ email, code, next }, issue) => {
		const result = await checkLoginCode(email, code);
		if (!result.ok) {
			invalid(
				issue.code(
					{
						expired: 'That code has expired. Ask for a new one.',
						locked: 'Too many wrong tries. Ask for a new code.',
						wrong: 'That code is not right.'
					}[result.reason]
				)
			);
		}

		await startSession(getRequestEvent().cookies, result.userId);
		redirect(303, next);
	}
);

export const signOut = command(async () => {
	await endSession(getRequestEvent().cookies);
	redirect(303, '/');
});
