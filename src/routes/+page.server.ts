import { fail } from '@sveltejs/kit';
import { db } from '#lib/server/db/index.js';
import { waitlist } from '#lib/server/db/schema.js';
import type { Actions } from './$types';

// Native `type="email"` covers the client; this is the trust boundary, so it checks again.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const actions: Actions = {
	join: async ({ request }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '')
			.trim()
			.toLowerCase();
		const city = String(form.get('city') ?? '').trim() || null;

		if (!EMAIL.test(email) || email.length > 254) {
			return fail(400, { email, error: 'That email address does not look right.' });
		}
		if (city && city.length > 80) {
			return fail(400, { email, error: 'That city name is too long.' });
		}

		try {
			await db.insert(waitlist).values({ email, city }).onConflictDoNothing();
		} catch {
			// The address is never lost to a stack trace the visitor cannot read.
			return fail(500, {
				email,
				error: 'We could not save that just now. Please try again in a minute.'
			});
		}

		return { joined: true };
	}
};
