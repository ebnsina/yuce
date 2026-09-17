import { expect, test, type Page } from '@playwright/test';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

// Writes to whatever DATABASE_URL points at. Point it at a Neon branch, not production.
const url = readFileSync('.env', 'utf8').match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!url) throw new Error('DATABASE_URL is not set — the feed tests need a database.');
const sql = neon(url);

/**
 * Signs in by writing the session the way the app does, rather than round-tripping a
 * login code the test cannot read out of the server's log.
 */
async function signIn(page: Page) {
	const id = randomUUID();
	const handle = `e2e${Date.now()}`;
	await sql`insert into "user" (id, email, handle, name) values (${id}, ${`${handle}@example.com`}, ${handle}, ${'Test Person'})`;

	const token = randomBytes(32).toString('base64url');
	const expires = new Date(Date.now() + 3600_000);
	await sql`insert into session (token_hash, user_id, expires_at) values (${createHash('sha256').update(token).digest('hex')}, ${id}, ${expires.toISOString()})`;

	await page
		.context()
		.addCookies([{ name: 'yuce_session', value: token, domain: 'localhost', path: '/' }]);
	return { id, handle };
}

test.afterAll(async () => {
	await sql`delete from "user" where handle like 'e2e%'`;
});

test('a post appears in the feed and can be deleted by its author', async ({ page }) => {
	await signIn(page);
	await page.goto('/home');

	const body = `Peace be upon you — ${Date.now()}`;
	await page.getByPlaceholder("Say something worth someone's time.").fill(body);
	await page.getByRole('button', { name: 'Post' }).click();

	await expect(page.getByText(body)).toBeVisible();

	await page.getByRole('button', { name: 'Delete' }).first().click();
	await expect(page.getByText(body)).toHaveCount(0);
});

test('an empty post is refused', async ({ page }) => {
	await signIn(page);
	await page.goto('/home');

	await page.getByPlaceholder("Say something worth someone's time.").fill('   ');
	await page.getByRole('button', { name: 'Post' }).click();

	await expect(page.getByText('Write something first.')).toBeVisible();
});

test('one person cannot delete another person’s post', async ({ page, browser }) => {
	const author = await signIn(page);
	await page.goto('/home');
	const body = `Written by the author — ${Date.now()}`;
	await page.getByPlaceholder("Say something worth someone's time.").fill(body);
	await page.getByRole('button', { name: 'Post' }).click();
	await expect(page.getByText(body)).toBeVisible();

	const other = await browser.newPage();
	await signIn(other);
	await other.goto('/home');
	await expect(other.getByText(body)).toBeVisible();
	// The post is readable, but its delete button belongs to the author alone.
	await expect(other.getByRole('button', { name: 'Delete' })).toHaveCount(0);

	await other.close();
	expect(author.id).toBeTruthy();
});
