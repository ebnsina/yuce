import { expect, test } from '@playwright/test';
import { cleanUp, signIn } from '../../lib/test-session';

test.afterAll(cleanUp);

/** Writes a post as somebody else, so the reporter is never the author. */
async function postAs(browser: import('@playwright/test').Browser, body: string) {
	const page = await browser.newPage();
	await signIn(page);
	await page.goto('/home');
	await page.getByPlaceholder("Say something worth someone's time.").fill(body);
	await page.getByRole('button', { name: 'Post' }).click();
	await expect(page.locator('article').filter({ hasText: body })).toBeVisible();
	await page.close();
}

test('the queue is shut to everyone but a moderator', async ({ page }) => {
	await signIn(page);
	const response = await page.goto('/moderation');
	expect(response?.status()).toBe(403);
});

test('a reported post reaches the queue and can be removed', async ({ page, browser }) => {
	const body = `Something worth reporting — ${Date.now()}`;
	await postAs(browser, body);

	// The reporter is an ordinary person, not the author and not a moderator.
	await signIn(page);
	await page.goto('/home');
	const card = page.locator('article').filter({ hasText: body });
	await expect(card).toBeVisible();

	await card.getByRole('button', { name: 'Report' }).click();
	await card.getByLabel('Which rule does this break?').selectOption('gheebah');
	await card.getByRole('button', { name: 'Send report' }).click();
	await expect(card.getByText('Reported.')).toBeVisible();

	// A moderator sees it waiting, and removing it takes the words off the feed.
	const mod = await browser.newPage();
	await signIn(mod, { moderator: true });
	await mod.goto('/moderation');

	const row = mod.locator('article').filter({ hasText: body });
	await expect(row).toBeVisible();
	await expect(row.getByText('Backbiting or slander')).toBeVisible();
	await row.getByRole('button', { name: 'Remove it' }).click();
	await expect(mod.locator('article').filter({ hasText: body })).toHaveCount(0);

	await page.reload();
	await expect(page.getByText(body)).toHaveCount(0);
	await expect(page.getByText('Removed by a moderator').first()).toBeVisible();

	await mod.close();
});

test('leaving a report alone keeps the post up', async ({ page, browser }) => {
	const body = `Nothing wrong with this — ${Date.now()}`;
	await postAs(browser, body);

	await signIn(page);
	await page.goto('/home');
	const card = page.locator('article').filter({ hasText: body });
	await expect(card).toBeVisible();
	await card.getByRole('button', { name: 'Report' }).click();
	await card.getByLabel('Which rule does this break?').selectOption('spam');
	await card.getByRole('button', { name: 'Send report' }).click();
	await expect(card.getByText('Reported.')).toBeVisible();

	const mod = await browser.newPage();
	await signIn(mod, { moderator: true });
	await mod.goto('/moderation');
	const row = mod.locator('article').filter({ hasText: body });
	await row.getByRole('button', { name: 'Leave it alone' }).click();
	await expect(mod.locator('article').filter({ hasText: body })).toHaveCount(0);

	await page.reload();
	await expect(page.getByText(body)).toBeVisible();

	await mod.close();
});
