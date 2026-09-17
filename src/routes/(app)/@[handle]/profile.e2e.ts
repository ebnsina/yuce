import { expect, test } from '@playwright/test';
import { cleanUp, signIn } from '../../../lib/test-session';

test.afterAll(cleanUp);

test('following someone puts their writing in your feed', async ({ page, browser }) => {
	const body = `Worth following for — ${Date.now()}`;

	const them = await browser.newPage();
	const author = await signIn(them);
	await them.goto('/home');
	await them.getByPlaceholder("Say something worth someone's time.").fill(body);
	await them.getByRole('button', { name: 'Post' }).click();
	await expect(them.locator('article').filter({ hasText: body })).toBeVisible();

	await signIn(page);
	await page.goto('/home');
	// Nothing followed yet, so the following feed is empty and says how to fix that.
	await expect(page.getByText(body)).toHaveCount(0);

	await page.goto(`/@${author.handle}`);
	await expect(page.getByText(body)).toBeVisible();
	await page.getByRole('button', { name: 'Follow' }).click();
	await expect(page.getByRole('button', { name: 'Following' })).toBeVisible();

	await page.goto('/home');
	await expect(page.getByText(body)).toBeVisible();

	// Unfollowing takes it back out again.
	await page.goto(`/@${author.handle}`);
	await page.getByRole('button', { name: 'Following' }).click();
	await expect(page.getByRole('button', { name: 'Follow', exact: true })).toBeVisible();
	await page.goto('/home');
	await expect(page.getByText(body)).toHaveCount(0);

	await them.close();
});

test('a profile shows a real post count and an edited name', async ({ page }) => {
	const me = await signIn(page);
	await page.goto('/settings');
	await page.getByLabel('Name').fill('Khadija Noor');
	await page.getByLabel('About you').fill('Testing the settings form.');
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();

	await page.goto('/home');
	await page
		.getByPlaceholder("Say something worth someone's time.")
		.fill(`Counting — ${Date.now()}`);
	await page.getByRole('button', { name: 'Post' }).click();

	await page.goto(`/@${me.handle}`);
	await expect(page.getByRole('heading', { name: 'Khadija Noor' })).toBeVisible();
	await expect(page.getByText('Testing the settings form.')).toBeVisible();
	// The counts were all zero once: drizzle rendered the subqueries unqualified.
	await expect(page.locator('main').getByText('1 post ·')).toBeVisible();
});
