import { expect, test } from '@playwright/test';
import { cleanUp, signIn, sql } from '../../../lib/test-session';

test.afterAll(cleanUp);

test('blocking hides both people from each other', async ({ page, browser }) => {
	const theirs = `Written before the block — ${Date.now()}`;
	const them = await browser.newPage();
	const other = await signIn(them);
	await them.goto('/home');
	await them.getByPlaceholder("Say something worth someone's time.").fill(theirs);
	await them.getByRole('button', { name: 'Post' }).click();
	await expect(them.locator('article').filter({ hasText: theirs })).toBeVisible();

	const me = await signIn(page);
	const mine = `Written by the blocker — ${Date.now()}`;
	await page.goto('/home');
	await page.getByPlaceholder("Say something worth someone's time.").fill(mine);
	await page.getByRole('button', { name: 'Post' }).click();
	await page.getByRole('button', { name: 'Everyone' }).click();
	await expect(page.getByText(theirs)).toBeVisible();

	await page.goto(`/@${other.handle}`);
	await page.getByRole('button', { name: 'Block' }).click();
	await expect(page.getByRole('button', { name: 'Unblock' })).toBeVisible();

	// Neither direction sees the other any more.
	await page.goto('/home');
	await page.getByRole('button', { name: 'Everyone' }).click();
	await expect(page.getByText(theirs)).toHaveCount(0);

	await them.goto('/home');
	await them.getByRole('button', { name: 'Everyone' }).click();
	await expect(them.getByText(mine)).toHaveCount(0);

	// Unblocking gives it back.
	await page.goto(`/@${other.handle}`);
	await page.getByRole('button', { name: 'Unblock' }).click();
	await page.goto('/home');
	await page.getByRole('button', { name: 'Everyone' }).click();
	await expect(page.getByText(theirs)).toBeVisible();

	expect(me.handle).toBeTruthy();
	await them.close();
});

test('your data comes back as a file you can read', async ({ page }) => {
	const me = await signIn(page);
	await page.goto('/home');
	const body = `For the export — ${Date.now()}`;
	await page.getByPlaceholder("Say something worth someone's time.").fill(body);
	await page.getByRole('button', { name: 'Post' }).click();
	await expect(page.locator('article').filter({ hasText: body })).toBeVisible();

	const response = await page.request.get('/settings/export');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-disposition']).toContain(`yuce-${me.handle}.json`);

	const data = await response.json();
	expect(data.account.handle).toBe(me.handle);
	expect(data.posts.map((p: { body: string }) => p.body)).toContain(body);
});

test('deleting an account needs the handle typed, and then it is gone', async ({ page }) => {
	const me = await signIn(page);
	await page.goto('/settings');

	await page.getByLabel(`Type @${me.handle} to confirm`).fill('not-my-handle');
	await page.getByRole('button', { name: 'Delete everything' }).click();
	await expect(page.getByText(`Type @${me.handle} exactly to confirm.`)).toBeVisible();

	await page.getByLabel(`Type @${me.handle} to confirm`).fill(me.handle);
	await page.getByRole('button', { name: 'Delete everything' }).click();
	await expect(page).toHaveURL('/');

	const left = await sql`select count(*)::int as n from "user" where id = ${me.id}`;
	expect(left[0].n).toBe(0);
});
