import { expect, test } from '@playwright/test';
import { cleanUp, signIn } from '../../../lib/test-session';

test.afterAll(cleanUp);

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
	// A new account follows nobody, so the post is only in the everyone feed.
	await other.getByRole('button', { name: 'Everyone' }).click();
	await expect(other.getByText(body)).toBeVisible();
	// The post is readable, but its delete button belongs to the author alone.
	await expect(other.getByRole('button', { name: 'Delete' })).toHaveCount(0);

	await other.close();
	expect(author.id).toBeTruthy();
});

test('a reply appears in the thread and counts on the post', async ({ page }) => {
	await signIn(page);
	await page.goto('/home');

	const body = `A post worth replying to — ${Date.now()}`;
	await page.getByPlaceholder("Say something worth someone's time.").fill(body);
	await page.getByRole('button', { name: 'Post' }).click();

	// Earlier tests leave posts behind, so every action is scoped to this one's article.
	const card = page.locator('article').filter({ hasText: body });
	await expect(card).toBeVisible();

	await card.getByRole('button', { name: 'Reply', exact: true }).click();

	const reply = `Wa alaikum assalam — ${Date.now()}`;
	await card.getByPlaceholder(/^Reply to /).fill(reply);
	await card.getByRole('button', { name: 'Send reply' }).click();
	await expect(card.getByText(reply)).toBeVisible();

	// The count only shows on a closed thread, and it is counted, not pluralised by hand.
	await card.getByRole('button', { name: 'Hide replies' }).click();
	await expect(card.getByRole('button', { name: '1 reply' })).toBeVisible();

	await card.getByRole('button', { name: '1 reply' }).click();
	await card.getByRole('button', { name: 'Delete reply' }).click();
	await expect(card.getByText(reply)).toHaveCount(0);
});

test('an empty reply is refused', async ({ page }) => {
	await signIn(page);
	await page.goto('/home');

	const body = `Post ${Date.now()}`;
	await page.getByPlaceholder("Say something worth someone's time.").fill(body);
	await page.getByRole('button', { name: 'Post' }).click();

	const card = page.locator('article').filter({ hasText: body });
	// Wait for the post to land before acting on it: under parallel workers the feed
	// refresh is slower than the click.
	await expect(card).toBeVisible();
	await card.getByRole('button', { name: 'Reply', exact: true }).click();

	await card.getByPlaceholder(/^Reply to /).fill('  ');
	await card.getByRole('button', { name: 'Send reply' }).click();
	await expect(card.getByText('Write something first.')).toBeVisible();
});
