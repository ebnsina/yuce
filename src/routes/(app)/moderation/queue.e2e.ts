import { expect, test } from '@playwright/test';
import { cleanUp, signIn } from '../../../lib/test-session';

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
	// The reporter follows nobody, so the post is in the everyone feed.
	await page.getByRole('button', { name: 'Everyone' }).click();
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
	await page.getByRole('button', { name: 'Everyone' }).click();
	await expect(page.getByText(body)).toHaveCount(0);
	await expect(page.getByText('Removed by a moderator').first()).toBeVisible();

	await mod.close();
});

test('leaving a report alone keeps the post up', async ({ page, browser }) => {
	const body = `Nothing wrong with this — ${Date.now()}`;
	await postAs(browser, body);

	await signIn(page);
	await page.goto('/home');
	// The reporter follows nobody, so the post is in the everyone feed.
	await page.getByRole('button', { name: 'Everyone' }).click();
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
	await page.getByRole('button', { name: 'Everyone' }).click();
	await expect(page.getByText(body)).toBeVisible();

	await mod.close();
});

test('the author is told, can appeal, and a second moderator can put it back', async ({
	page,
	browser
}) => {
	const body = `Taken down by mistake — ${Date.now()}`;

	// The author posts, somebody else reports, a moderator removes.
	const author = await browser.newPage();
	await signIn(author);
	await author.goto('/home');
	await author.getByPlaceholder("Say something worth someone's time.").fill(body);
	await author.getByRole('button', { name: 'Post' }).click();
	await expect(author.locator('article').filter({ hasText: body })).toBeVisible();

	await signIn(page);
	await page.goto('/home');
	// The reporter follows nobody, so the post is in the everyone feed.
	await page.getByRole('button', { name: 'Everyone' }).click();
	const card = page.locator('article').filter({ hasText: body });
	await expect(card).toBeVisible();
	await card.getByRole('button', { name: 'Report' }).click();
	await card.getByLabel('Which rule does this break?').selectOption('gheebah');
	await card.getByRole('button', { name: 'Send report' }).click();
	await expect(card.getByText('Reported.')).toBeVisible();

	const firstMod = await browser.newPage();
	await signIn(firstMod, { moderator: true });
	await firstMod.goto('/moderation');
	await firstMod
		.locator('article')
		.filter({ hasText: body })
		.getByRole('button', { name: 'Remove it' })
		.click();

	// The author is told without having to go looking for it.
	await author.reload();
	// The notice, not the removed post in the feed: both say who took it down.
	const notice = author.locator('article').filter({ hasText: 'was taken down' });
	await expect(notice.getByRole('heading', { name: /Backbiting or slander/ })).toBeVisible();

	await notice.getByRole('textbox').fill('Nobody was named and nothing was said behind anyone.');
	await notice.getByRole('button', { name: 'Appeal this' }).click();
	await expect(author.getByText('Your appeal is with a moderator.')).toBeVisible();

	// The moderator who removed it cannot judge the objection to their own decision.
	await firstMod.reload();
	const own = firstMod.locator('article').filter({ hasText: 'Appeal' });
	await own.getByRole('button', { name: 'Put it back' }).click();
	await expect(firstMod.getByText('somebody else has to read the appeal')).toBeVisible();

	// A second moderator can, and the words come back.
	const secondMod = await browser.newPage();
	await signIn(secondMod, { moderator: true });
	await secondMod.goto('/moderation');
	await secondMod
		.locator('article')
		.filter({ hasText: body })
		.getByRole('button', { name: 'Put it back' })
		.click();

	await page.reload();
	await page.getByRole('button', { name: 'Everyone' }).click();
	await expect(page.getByText(body)).toBeVisible();

	await author.close();
	await firstMod.close();
	await secondMod.close();
});
