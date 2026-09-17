import { pgTable, serial, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';

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
	// Moderators are recruited from the community, so this is set by hand, not earned.
	isModerator: boolean('is_moderator').notNull().default(false),
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
		removedAt: timestamp('removed_at'),
		removedReason: text('removed_reason'),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('post_created_idx').on(t.createdAt)]
);

export const comment = pgTable(
	'comment',
	{
		id: text('id').primaryKey(),
		postId: text('post_id')
			.notNull()
			.references(() => post.id, { onDelete: 'cascade' }),
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		body: text('body').notNull(),
		removedAt: timestamp('removed_at'),
		removedReason: text('removed_reason'),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('comment_post_idx').on(t.postId, t.createdAt)]
);

/**
 * One row per report, kept after it is settled: the monthly count the policy promises
 * has to come from somewhere, including the ones we got wrong.
 */
export const report = pgTable(
	'report',
	{
		id: text('id').primaryKey(),
		targetKind: text('target_kind').notNull(),
		targetId: text('target_id').notNull(),
		reporterId: text('reporter_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		rule: text('rule').notNull(),
		note: text('note'),
		state: text('state').notNull().default('open'),
		decidedBy: text('decided_by').references(() => user.id, { onDelete: 'set null' }),
		decidedAt: timestamp('decided_at'),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('report_state_idx').on(t.state, t.createdAt)]
);

/**
 * One appeal per removal, one level, read by a person. Kept after it is settled for
 * the same reason reports are: an overturned removal is the number that matters most.
 */
export const appeal = pgTable(
	'appeal',
	{
		id: text('id').primaryKey(),
		reportId: text('report_id')
			.notNull()
			.unique()
			.references(() => report.id, { onDelete: 'cascade' }),
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		note: text('note').notNull(),
		state: text('state').notNull().default('open'),
		decidedBy: text('decided_by').references(() => user.id, { onDelete: 'set null' }),
		decidedAt: timestamp('decided_at'),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => [index('appeal_state_idx').on(t.state, t.createdAt)]
);
