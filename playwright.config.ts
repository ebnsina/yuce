import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: { command: 'pnpm build && pnpm preview', port: 5189, reuseExistingServer: false },
	testMatch: '**/*.e2e.{ts,js}',
	// One worker: the feed and the moderation queue are one shared list for everybody,
	// so tests running side by side act on each other's rows. The suite takes under a
	// minute, which is cheaper than making every assertion defensive about it.
	workers: 1
});
