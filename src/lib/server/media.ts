import { randomUUID } from 'node:crypto';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
	S3_ACCESS_KEY_ID,
	S3_BUCKET,
	S3_ENDPOINT,
	S3_REGION,
	S3_SECRET_ACCESS_KEY
} from '$app/env/private';

export const MAX_IMAGES = 4;
export const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Path-style: VaultS3, R2 and B2 all want it, and virtual-host style needs DNS per
// bucket. Connected on first use, so a build never opens a socket.
let client: S3Client | undefined;
const s3 = () =>
	(client ??= new S3Client({
		endpoint: S3_ENDPOINT,
		region: S3_REGION,
		forcePathStyle: true,
		credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY }
	}));

export function checkImage(file: File) {
	if (!TYPES.includes(file.type)) return 'Images only — JPEG, PNG, WebP or GIF.';
	if (file.size > MAX_BYTES) return 'Each image has to be under 5MB.';
	return null;
}

/** Keys are random and carry the date, so nothing is guessable and nothing collides. */
export async function putImage(file: File) {
	const day = new Date().toISOString().slice(0, 10);
	const key = `posts/${day}/${randomUUID()}`;

	await s3().send(
		new PutObjectCommand({
			Bucket: S3_BUCKET,
			Key: key,
			Body: new Uint8Array(await file.arrayBuffer()),
			ContentType: file.type,
			CacheControl: 'public, max-age=31536000, immutable'
		})
	);

	return { key, mime: file.type };
}

export async function readImage(key: string) {
	const res = await s3().send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
	return {
		body: res.Body?.transformToWebStream(),
		mime: res.ContentType ?? 'application/octet-stream',
		length: res.ContentLength
	};
}
