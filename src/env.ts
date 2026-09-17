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
	},
	S3_ENDPOINT: { description: 'S3-compatible endpoint for images.' },
	S3_REGION: { description: 'S3 region.' },
	S3_ACCESS_KEY_ID: { description: 'S3 access key id.' },
	S3_SECRET_ACCESS_KEY: { description: 'S3 secret access key.' },
	S3_BUCKET: { description: 'Bucket that holds uploaded images.' }
});
