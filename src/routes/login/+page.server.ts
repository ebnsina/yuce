import { fail, redirect } from '@sveltejs/kit';
import { checkLoginCode, issueLoginCode, startSession, sweepExpired } from '#lib/server/auth.js';
import { sendLoginCode } from '#lib/server/email.js';
import type { Actions, PageServerLoad } from './$types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const safeNext = (next: FormDataEntryValue | null) => {
	const value = String(next ?? '');
	// Only same-site paths: an open redirect turns a login page into a phishing tool.
	return value.startsWith('/') && !value.startsWith('//') ? value : '/home';
};

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('next')));
	return { next: url.searchParams.get('next') ?? '' };
};

export const actions: Actions = {
	send: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const next = safeNext(form.get('next'));

		if (!EMAIL.test(email) || email.length > 254) {
			return fail(400, { step: 'email', email, error: 'That email address does not look right.' });
		}

		try {
			await sweepExpired();
			const issued = await issueLoginCode(email);
			if (!issued.sent) {
				return fail(429, {
					step: 'code',
					email,
					next,
					error: 'A code is already on its way. Give it a minute, then ask again.'
				});
			}
			await sendLoginCode(email, issued.code);
		} catch {
			return fail(500, {
				step: 'email',
				email,
				error: 'We could not send the code just now. Please try again in a minute.'
			});
		}

		return { step: 'code', email, next };
	},

	verify: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const code = String(form.get('code') ?? '').trim();
		const next = safeNext(form.get('next'));

		if (!/^\d{6}$/.test(code)) {
			return fail(400, { step: 'code', email, next, error: 'The code is six digits.' });
		}

		const result = await checkLoginCode(email, code);
		if (!result.ok) {
			const message = {
				expired: 'That code has expired. Ask for a new one.',
				locked: 'Too many wrong tries. Ask for a new code.',
				wrong: 'That code is not right.'
			}[result.reason];
			return fail(400, {
				step: result.reason === 'wrong' ? 'code' : 'email',
				email,
				next,
				error: message
			});
		}

		await startSession(cookies, result.userId);
		redirect(303, next);
	}
};
