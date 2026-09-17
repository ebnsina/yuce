import { pgTable, serial, text, timestamp, integer, index } from 'drizzle-orm/pg-core';

export const waitlist = pgTable('waitlist', {
	id: serial('id').primaryKey(),
	email: text('email').notNull().unique(),
	city: text('city'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	handle: text('handle').notNull().unique(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

// The token itself is never stored, only its hash: a leaked database cannot be used
// to sign in as anyone.
export const session = pgTable(
	'session',
	{
		tokenHash: text('token_hash').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('session_user_idx').on(t.userId)]
);

// Six digits is little entropy, so the row carries its own attempt counter and a
// short expiry rather than relying on the code being hard to guess.
export const loginCode = pgTable('login_code', {
	email: text('email').primaryKey(),
	codeHash: text('code_hash').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	attempts: integer('attempts').notNull().default(0),
	sentAt: timestamp('sent_at').notNull().defaultNow()
});

export const post = pgTable(
	'post',
	{
		id: text('id').primaryKey(),
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		body: text('body').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('post_created_idx').on(t.createdAt)]
);
