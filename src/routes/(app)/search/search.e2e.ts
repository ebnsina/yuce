import { expect, test } from '@playwright/test';
import { cleanUp, signIn } from '../../../lib/test-session';

test.afterAll(cleanUp);

test('search finds a person and the words they wrote', async ({ page, browser }) => {
	const word = `quraysh${Date.now()}`;
	const them = await browser.newPage();
	const author = await signIn(them);
	await them.goto('/home');
	await them.getByPlaceholder("Say something worth someone's time.").fill(`A post about ${word}.`);
	await them.getByRole('button', { name: 'Post' }).click();
	await expect(them.locator('article').filter({ hasText: word })).toBeVisible();

	await signIn(page);
	await page.goto('/search');
	await page.getByRole('searchbox').fill(word);
	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page.getByText(`A post about ${word}.`)).toBeVisible();

	// The handle is searchable too, and it leads to the profile.
	await page.getByRole('searchbox').fill(author.handle);
	await page.getByRole('button', { name: 'Search' }).click();
	await page
		.getByRole('link', { name: new RegExp(author.handle) })
		.first()
		.click();
	await expect(page).toHaveURL(`/@${author.handle}`);

	await them.close();
});

test('a search with nothing behind it says so', async ({ page }) => {
	await signIn(page);
	await page.goto('/search?q=zzzznothinghere');
	await expect(page.getByText('Nothing for')).toBeVisible();
});

test('a blocked person is not findable', async ({ page, browser }) => {
	const word = `hidden${Date.now()}`;
	const them = await browser.newPage();
	const author = await signIn(them);
	await them.goto('/home');
	await them.getByPlaceholder("Say something worth someone's time.").fill(`Says ${word} out loud.`);
	await them.getByRole('button', { name: 'Post' }).click();
	await expect(them.locator('article').filter({ hasText: word })).toBeVisible();

	await signIn(page);
	await page.goto(`/@${author.handle}`);
	await page.getByRole('button', { name: 'Block' }).click();
	await expect(page.getByRole('button', { name: 'Unblock' })).toBeVisible();

	await page.goto(`/search?q=${word}`);
	await expect(page.getByText('Nothing for')).toBeVisible();

	await them.close();
});
