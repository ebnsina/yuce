import { expect, test } from '@playwright/test';

// Writes to whatever DATABASE_URL points at. Point it at a Neon branch, not production.
const address = () => `e2e.${Date.now()}@example.com`;

test('the waitlist takes a good address and refuses a bad one', async ({ page }) => {
	await page.goto('/');

	// 'a@b' satisfies the browser's own email check, so this reaches the server rule.
	await page.getByPlaceholder('you@example.com').fill('a@b');
	await page.getByRole('button', { name: 'Request invite' }).first().click();
	await expect(page.getByText('That email address does not look right.')).toBeVisible();

	await page.getByPlaceholder('you@example.com').fill(address());
	await page.getByRole('button', { name: 'Request invite' }).first().click();
	await expect(page.getByText('You are on the list.')).toBeVisible();
});

test('asking for a code moves to the code step', async ({ page }) => {
	await page.goto('/login');

	await page.getByPlaceholder('you@example.com').fill(address());
	await page.getByRole('button', { name: 'Send me a code' }).click();

	await expect(page.getByRole('heading', { name: 'Check your email.' })).toBeVisible();
	await expect(page.getByPlaceholder('000000')).toBeVisible();
});

test('a wrong code is rejected', async ({ page }) => {
	await page.goto('/login');
	await page.getByPlaceholder('you@example.com').fill(address());
	await page.getByRole('button', { name: 'Send me a code' }).click();

	await page.getByPlaceholder('000000').fill('000000');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page.getByText('That code is not right.')).toBeVisible();
});

test('the home page is closed to anyone signed out', async ({ page }) => {
	await page.goto('/home');
	await expect(page).toHaveURL(/\/login\?next=%2Fhome/);
});
