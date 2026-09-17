import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { media } from '#lib/server/db/schema.js';
import { readImage } from '#lib/server/media.js';
import type { RequestHandler } from './$types';

/**
 * Images are served through the app rather than from a public bucket: the bucket stays
 * private, and one day this is where a sensitive image gets its blurred derivative
 * instead of the original. A CDN belongs in front of this, not instead of it.
 */
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const key = params.key;
	const [row] = await db.select({ mime: media.mime }).from(media).where(eq(media.key, key));
	if (!row) error(404, 'No such image.');

	const file = await readImage(key).catch(() => null);
	if (!file?.body) error(404, 'No such image.');

	setHeaders({
		'content-type': file.mime || row.mime,
		// The key never changes for a given image, so it can be cached forever.
		'cache-control': 'public, max-age=31536000, immutable'
	});
	return new Response(file.body);
};
