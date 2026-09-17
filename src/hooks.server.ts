import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, readSession } from '#lib/server/auth.js';

// Everything under these paths needs an account. Anything else is public.
const PRIVATE = ['/home', '/settings'];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await readSession(event.cookies.get(SESSION_COOKIE));

	if (!event.locals.user && PRIVATE.some((p) => event.url.pathname.startsWith(p))) {
		redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`);
	}

	return resolve(event);
};
