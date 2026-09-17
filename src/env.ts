import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'The database connection string.' },
	RESEND_API_KEY: {
		description: 'Resend API key. Without it, login codes are printed to the server log.',
		schema: (value) => value
	},
	EMAIL_FROM: {
		description: 'Sender address for login codes, e.g. "Yuce <hello@yuce.app>".',
		schema: (value) => value
	}
});
