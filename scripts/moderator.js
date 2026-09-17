// Moderators are appointed by hand: `pnpm moderator you@example.com [off]`
import { neon } from '@neondatabase/serverless';

const [email, off] = process.argv.slice(2);
if (!email) throw new Error('Usage: pnpm moderator <email> [off]');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`update "user" set is_moderator = ${off !== 'off'}
	where email = ${email.toLowerCase()} returning handle, is_moderator`;

if (!rows.length) throw new Error(`No account for ${email} — sign in once first.`);
console.log(
	`@${rows[0].handle} is ${rows[0].is_moderator ? 'now a moderator' : 'no longer a moderator'}.`
);
