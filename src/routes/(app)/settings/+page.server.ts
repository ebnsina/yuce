import type { PageServerLoad } from './$types';

// The hook has already turned away anyone without a session.
export const load: PageServerLoad = ({ locals }) => ({ user: locals.user! });
