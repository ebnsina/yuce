import type { PageServerLoad } from './$types';

// The hook already redirected anyone without a session, so the user is present here.
export const load: PageServerLoad = ({ locals }) => ({ user: locals.user! });
