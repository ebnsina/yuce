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

## Checks

```sh
pnpm check      # types
pnpm lint       # formatting and lint
pnpm test       # unit and end-to-end
pnpm db:push    # apply the schema
```

The end-to-end tests write to whatever `DATABASE_URL` points at. Point it at a Neon
branch (`neon checkout test`), not production.
