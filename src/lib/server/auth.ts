import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db } from './db/index.js';
import { loginCode, session, user } from './db/schema.js';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = 'yuce_session';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const equal = (a: string, b: string) =>
	a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Issues a code, or refuses if one was sent less than a minute ago. */
export async function issueLoginCode(email: string) {
	const [existing] = await db.select().from(loginCode).where(eq(loginCode.email, email));
	if (existing && Date.now() - existing.sentAt.getTime() < RESEND_AFTER_MS) {
		return { sent: false as const, retryInSeconds: 60 };
	}

	const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
	const row = {
		email,
		codeHash: hash(code),
		expiresAt: new Date(Date.now() + CODE_TTL_MS),
		attempts: 0,
		sentAt: new Date()
	};
	await db.insert(loginCode).values(row).onConflictDoUpdate({ target: loginCode.email, set: row });

	return { sent: true as const, code };
}

type CheckResult =
	{ ok: true; userId: string } | { ok: false; reason: 'expired' | 'wrong' | 'locked' };

/** One code, one use. A wrong guess costs an attempt; five wrong guesses burn it. */
export async function checkLoginCode(email: string, code: string): Promise<CheckResult> {
	const [row] = await db.select().from(loginCode).where(eq(loginCode.email, email));
	if (!row) return { ok: false, reason: 'expired' };

	if (row.expiresAt.getTime() < Date.now()) {
		await db.delete(loginCode).where(eq(loginCode.email, email));
		return { ok: false, reason: 'expired' };
	}
	if (row.attempts >= MAX_ATTEMPTS) {
		await db.delete(loginCode).where(eq(loginCode.email, email));
		return { ok: false, reason: 'locked' };
	}
	if (!equal(row.codeHash, hash(code))) {
		await db
			.update(loginCode)
			.set({ attempts: row.attempts + 1 })
			.where(eq(loginCode.email, email));
		return { ok: false, reason: 'wrong' };
	}

	await db.delete(loginCode).where(eq(loginCode.email, email));
	const account = await findOrCreateUser(email);
	return { ok: true, userId: account.id };
}

async function findOrCreateUser(email: string) {
	const [existing] = await db.select().from(user).where(eq(user.email, email));
	if (existing) return existing;

	const [created] = await db
		.insert(user)
		.values({
			id: crypto.randomUUID(),
			email,
			handle: await freeHandle(email),
			name: email.split('@')[0]
		})
		.returning();
	return created;
}

/** Derives a handle from the address, then counts up until the name is free. */
async function freeHandle(email: string) {
	const base =
		email
			.split('@')[0]
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '') || 'member';
	for (let n = 0; ; n++) {
		const candidate = n === 0 ? base : `${base}${n}`;
		const [taken] = await db.select({ id: user.id }).from(user).where(eq(user.handle, candidate));
		if (!taken) return candidate;
	}
}

export async function startSession(cookies: Cookies, userId: string) {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
	await db.insert(session).values({ tokenHash: hash(token), userId, expiresAt });

	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.env.DEV,
		expires: expiresAt
	});
}

export async function readSession(token: string | undefined) {
	if (!token) return null;

	const [row] = await db
		.select({ userId: session.userId, expiresAt: session.expiresAt })
		.from(session)
		.where(eq(session.tokenHash, hash(token)));
	if (!row) return null;

	if (row.expiresAt.getTime() < Date.now()) {
		await db.delete(session).where(eq(session.tokenHash, hash(token)));
		return null;
	}

	const [account] = await db
		.select({ id: user.id, email: user.email, handle: user.handle, name: user.name })
		.from(user)
		.where(eq(user.id, row.userId));
	return account ?? null;
}

export async function endSession(cookies: Cookies) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await db.delete(session).where(eq(session.tokenHash, hash(token)));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** Expired rows are dead weight; clearing them is one statement, so it runs on login. */
export async function sweepExpired() {
	const now = new Date();
	await db.delete(session).where(lt(session.expiresAt, now));
	await db.delete(loginCode).where(lt(loginCode.expiresAt, now));
}
