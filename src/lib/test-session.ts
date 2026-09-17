import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import type { Page } from '@playwright/test';

// Writes to whatever DATABASE_URL points at. Point it at a Neon branch, not production.
const url = readFileSync('.env', 'utf8').match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!url) throw new Error('DATABASE_URL is not set — the end-to-end tests need a database.');

export const sql = neon(url);

/**
 * Signs in by writing the session the way the app does, rather than round-tripping a
 * login code the test cannot read out of the server's log.
 */
const made: string[] = [];

export async function signIn(page: Page, { moderator = false } = {}) {
	const id = randomUUID();
	made.push(id);
	const handle = `e2e${Date.now()}${Math.floor(Math.random() * 1000)}`;
	await sql`insert into "user" (id, email, handle, name, is_moderator)
		values (${id}, ${`${handle}@example.com`}, ${handle}, ${'Test Person'}, ${moderator})`;

	const token = randomBytes(32).toString('base64url');
	const expires = new Date(Date.now() + 3600_000);
	await sql`insert into session (token_hash, user_id, expires_at)
		values (${createHash('sha256').update(token).digest('hex')}, ${id}, ${expires.toISOString()})`;

	await page
		.context()
		.addCookies([{ name: 'yuce_session', value: token, domain: 'localhost', path: '/' }]);
	return { id, handle };
}

/**
 * Only the accounts this file made. Deleting every `e2e%` user takes out the ones a
 * test file running beside this one is still using, and their posts cascade with them.
 */
export const cleanUp = async () => {
	if (made.length) await sql`delete from "user" where id = any(${made})`;
	made.length = 0;
};
