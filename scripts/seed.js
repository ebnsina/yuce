/**
 * Puts a believable community in the database so every feature has something to act
 * on: `pnpm seed`. Everything it makes is prefixed `seed`, and `pnpm seed clear`
 * removes exactly that and nothing else.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { deflateSync } from 'node:zlib';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
const sql = neon(process.env.DATABASE_URL);

const clear = process.argv[2] === 'clear';
if (clear) {
	await sql`delete from "user" where handle like 'seed%'`;
	await sql`delete from waitlist where email like 'seed%'`;
	console.log('Seed data removed.');
	process.exit(0);
}

const s3 = new S3Client({
	endpoint: process.env.S3_ENDPOINT,
	region: process.env.S3_REGION,
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY_ID,
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
	}
});

/** A 2×2 PNG in one of four colours, so an image is a real object in the bucket. */
function tinyPng(rgb) {
	const chunk = (type, data) => {
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length);
		const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
		const crcTable = [...Array(256)].map((_, n) => {
			let c = n;
			for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			return c >>> 0;
		});
		let crc = 0xffffffff;
		for (const byte of body) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
		const crcBuf = Buffer.alloc(4);
		crcBuf.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
		return Buffer.concat([len, body, crcBuf]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(2, 0);
	ihdr.writeUInt32BE(2, 4);
	ihdr[8] = 8;
	ihdr[9] = 2;
	const row = Buffer.concat([Buffer.from([0]), Buffer.from(rgb), Buffer.from(rgb)]);
	const raw = Buffer.concat([row, row]);
	return Buffer.concat([
		Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', deflateSync(raw)),
		chunk('IEND', Buffer.alloc(0))
	]);
}

async function upload(bytes) {
	const key = `posts/seed/${randomUUID()}`;
	await s3.send(
		new PutObjectCommand({
			Bucket: process.env.S3_BUCKET,
			Key: key,
			Body: bytes,
			ContentType: 'image/png'
		})
	);
	return key;
}

const people = [
	['seedamina', 'Amina Rahman', 'Teacher. Reads more than she posts.', true],
	['seedbilal', 'Bilal Chowdhury', 'Father of two. Still learning Arabic.', false],
	['seednusaybah', 'Nusaybah Haq', 'Runs the sisters’ halaqa on Saturdays.', false],
	['seedyusuf', 'Yusuf Karim', 'Engineer. Opinions about jamaat times.', false],
	['seedfariha', 'Fariha Sultana', 'Photographs weddings.', false]
];

const tokens = {};
const ids = {};

for (const [handle, name, bio, isModerator] of people) {
	const id = randomUUID();
	ids[handle] = id;
	await sql`insert into "user" (id, email, handle, name, bio, is_moderator)
		values (${id}, ${handle + '@example.com'}, ${handle}, ${name}, ${bio}, ${isModerator})`;

	const token = randomBytes(32).toString('base64url');
	tokens[handle] = token;
	await sql`insert into session (token_hash, user_id, expires_at)
		values (${createHash('sha256').update(token).digest('hex')}, ${id},
			${new Date(Date.now() + 30 * 86400000).toISOString()})`;
}

const minutes = (n) => new Date(Date.now() - n * 60000).toISOString();

async function write(handle, body, ago, images = []) {
	const id = randomUUID();
	await sql`insert into post (id, author_id, body, created_at)
		values (${id}, ${ids[handle]}, ${body}, ${minutes(ago)})`;
	let position = 0;
	for (const rgb of images) {
		const key = await upload(tinyPng(rgb));
		await sql`insert into media (id, post_id, key, mime, position)
			values (${randomUUID()}, ${id}, ${key}, ${'image/png'}, ${position++})`;
	}
	return id;
}

const a = await write(
	'seedyusuf',
	'Fajr jamaat at the masjid on 12th moved to 5:10. Third change this month — trust the timetable on the wall, not the app.',
	12
);
const b = await write(
	'seedbilal',
	'Finished Surah Al-Kahf with my daughter tonight. She corrected me twice. Never been happier to be wrong.',
	40
);
await write('seedfariha', 'Cousin’s walima last night. Whole family in one frame for once.', 95, [
	[122, 31, 61],
	[201, 106, 133]
]);
const d = await write(
	'seednusaybah',
	'Halaqa moved to 4pm on Saturdays. Bring a notebook, we are starting Nawawi’s forty.',
	180
);
const spam = await write(
	'seedamina',
	'You will not believe what the new imam did at the committee meeting — everyone was talking about it afterwards.',
	240
);

await sql`insert into comment (id, post_id, author_id, body, created_at) values
	(${randomUUID()}, ${a}, ${ids['seedbilal']}, ${'JazakAllah khair. Are taraweeh times changing too?'}, ${minutes(9)}),
	(${randomUUID()}, ${a}, ${ids['seedamina']}, ${'The committee posts the sheet on Thursdays now.'}, ${minutes(5)}),
	(${randomUUID()}, ${b}, ${ids['seednusaybah']}, ${'MashaAllah. Mine corrects my tajweed constantly.'}, ${minutes(30)})`;

await sql`insert into post_like (post_id, user_id) values
	(${a}, ${ids['seedbilal']}), (${a}, ${ids['seedamina']}), (${a}, ${ids['seedfariha']}),
	(${b}, ${ids['seedyusuf']}), (${b}, ${ids['seednusaybah']}),
	(${d}, ${ids['seedamina']})`;

await sql`insert into follow (follower_id, followee_id) values
	(${ids['seedamina']}, ${ids['seedyusuf']}), (${ids['seedamina']}, ${ids['seedbilal']}),
	(${ids['seedbilal']}, ${ids['seedyusuf']}), (${ids['seednusaybah']}, ${ids['seedamina']}),
	(${ids['seedyusuf']}, ${ids['seedfariha']})`;

// One report waiting in the queue, so moderation has something real to decide.
await sql`insert into report (id, target_kind, target_id, reporter_id, rule, note, state)
	values (${randomUUID()}, 'post', ${spam}, ${ids['seedbilal']}, 'gheebah',
		${'Talking about a named person behind his back.'}, 'open')`;

// And one already removed, with an appeal waiting on it.
const removed = await write(
	'seedfariha',
	'Reposting this because people keep asking — the loan scheme pays 12% monthly, guaranteed.',
	300
);
const settled = randomUUID();
await sql`update post set removed_at = now(), removed_reason = 'riba' where id = ${removed}`;
await sql`insert into report (id, target_kind, target_id, reporter_id, rule, state, decided_by, decided_at)
	values (${settled}, 'post', ${removed}, ${ids['seedyusuf']}, 'riba', 'removed', ${ids['seedamina']}, now())`;
await sql`insert into appeal (id, report_id, author_id, note, state)
	values (${randomUUID()}, ${settled}, ${ids['seedfariha']},
		${'I was warning people about the scheme, not promoting it.'}, 'open')`;

await sql`insert into waitlist (email, city) values
	('seed1@example.com', 'Dhaka'), ('seed2@example.com', 'Kuala Lumpur'), ('seed3@example.com', 'London')`;

console.log('\nSeeded. Sign in as anyone by pasting their cookie value:\n');
for (const [handle, , , isModerator] of people) {
	console.log(`  @${handle}${isModerator ? '  (moderator)' : ''}\n    ${tokens[handle]}`);
}
console.log(`
In the browser console on http://localhost:5188:

  document.cookie = 'yuce_session=<token>; path=/'; location.href = '/home'

Waiting for you: 5 people, 6 posts (one with two images, one removed for riba),
3 replies, 6 likes, 5 follows, 1 report in the queue, 1 appeal, 3 on the waitlist.
Remove all of it with: pnpm seed clear
`);
