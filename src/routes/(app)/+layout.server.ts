import type { LayoutServerLoad } from './$types';

// The hook has already turned away anyone without a session on these paths.
export const load: LayoutServerLoad = ({ locals }) => ({ user: locals.user! });
