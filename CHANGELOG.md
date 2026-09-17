# Changelog

Every user-facing change, newest first. Dates are the day the change landed.

## Unreleased

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
