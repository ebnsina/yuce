# Changelog

Every user-facing change, newest first. Dates are the day the change landed.

## Unreleased

### Added

- Replies. Open a thread under any post, reply in up to 500 characters, delete your
  own. The reply count sits on the post, and a thread is only fetched once you open
  it.
- A feed. Write a post of up to 1,000 characters, read everyone else's newest first,
  and delete your own. No ranking, no scoring — the order is the order things were
  written in.

### Changed

- The landing page and the privacy page were rebuilt so they stop reading like
  documentation: a burgundy band carries the content policy, the blur is something
  you tap rather than a paragraph about tapping, and the feed beside the pitch looks
  like a surface rather than three boxes.
- The landing page shows the product rather than describing it: a feed beside the
  pitch, a blurred photo you can see the shape of, and a post removed for gheebah
  with the reason attached. The number waiting is the real one.

- Forms are remote functions now, validated by one schema that runs on the server and
  again in the browser. Every form still works with JavaScript off.

### Added

- Sign in with a code sent to your email. No password to forget, and none for us to
  lose. A code lasts ten minutes, works once, and stops accepting guesses after five.
- Accounts. A handle is taken from your address and made unique, and you can sign out
  from the home page.
- Privacy page: what is collected today (an email, a city if you gave one, the date),
  what the app is structurally unable to do, where the data currently sits, and how to
  have it deleted. Dated, and short enough to read.
- Landing page: the positioning, the content policy in plain language, how moderation
  works, and an invite request form.
- Invite waitlist. Email and optional city, stored once per address — asking twice is
  not an error and is not reported as one.
- Design system: burgundy on near-monochrome, light by default, dark mode supported.
  Self-hosted fonts, no CDN and no third-party request in the page.
- Media components for the two policy decisions the product turns on: audio muted by
  default, and sensitive photos blurred behind a tap rather than removed.
