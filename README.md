# Yuce

A social network for Muslims. Ordinary posting, an unusual content policy.

`plan.md` lives in `docs/`, which is not committed.

## Running it

```sh
pnpm install
pnpm dev        # http://localhost:5188  — fixed, never reassigned
pnpm preview    # http://localhost:5189  — what the tests run against
```

Both ports are pinned with `strictPort`, so a clash fails loudly instead of moving
the app to a port you are not looking at.

## Environment

`.env` is pulled from Neon by `neon link`. `DATABASE_URL` is required and the app
refuses to start without it. `RESEND_API_KEY` and `EMAIL_FROM` are optional in dev,
where login codes are printed to the terminal instead of emailed, and required in
production.

## Object storage

Images live in an S3-compatible bucket. In development that is
[VaultS3](https://vaults3.com) — a single self-hosted binary, no account, no cloud:

```sh
VAULTS3_ACCESS_KEY=yuce-dev VAULTS3_SECRET_KEY=yuce-dev-secret ./vaults3   # :9000
vaults3-cli bucket create yuce-media
```

The five `S3_*` variables in `.env` point at it. The same five point at Cloudflare R2,
Backblaze B2 or anything else that speaks S3 — nothing in the app knows which.

## Seed data

```sh
pnpm seed         # five people, posts with images, replies, likes, follows,
                  # a report in the queue, an appeal, three on the waitlist
pnpm seed clear   # removes exactly what it made and nothing else
```

It prints a session token per person. Paste one into the browser console:

```js
document.cookie = 'yuce_session=<token>; path=/';
location.href = '/home';
```

## Making an account

Sign in at `/login` with any address. There is no mail provider in development, so the
six-digit code is printed on the page and in the terminal. To see the moderation queue,
sign in once and then:

```sh
pnpm moderator you@example.com       # appoint
pnpm moderator you@example.com off   # stand down
```

## Checks

```sh
pnpm check      # types
pnpm lint       # formatting and lint
pnpm test       # unit and end-to-end
pnpm db:push    # apply the schema
```

The end-to-end tests write to whatever `DATABASE_URL` points at. Point it at a Neon
branch (`neon checkout test`), not production.
