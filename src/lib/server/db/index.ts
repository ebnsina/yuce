import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { DATABASE_URL } from '$app/env/private';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Connected on first query, not on import: the build step loads every server module,
// and an eager client turns a placeholder connection string into a failed build.
let instance: ReturnType<typeof drizzle<typeof schema>> | undefined;

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
	get(_, prop) {
		instance ??= drizzle(neon(DATABASE_URL), { schema });
		return Reflect.get(instance, prop);
	}
});
