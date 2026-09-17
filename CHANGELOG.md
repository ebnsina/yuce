# Changelog

Every user-facing change, newest first. Dates are the day the change landed.

## Unreleased

### Added

- Up to four images on a post. They are stored in an S3-compatible bucket and served
  through the app, so the bucket stays private and a sensitive image can be swapped
  for its blurred version at that one place.
- `pnpm seed` fills the database with a small community — people, posts with images,
  replies, likes, follows, a report waiting in the queue and an appeal — so every
  feature has something real to act on. `pnpm seed clear` removes exactly that.

- Search, over people and the words in posts. Blocked people do not appear in it.

- Likes. One per person per post, with the count beside it, and clicking again takes
  it back.
- Reply counts sit on the post itself, so you can see a conversation exists without
  opening it.
- Icons throughout, from Hugeicons, compiled into the bundle rather than fetched.

- Blocking. One row, working both ways: neither of you sees the other, and the
  follow in either direction goes with it.
- Download everything we hold about you from your settings, as one file you can read
  without this app.
- Delete your account from your settings. Your posts, replies, follows and blocks go
  with it, and deleted means the rows are gone.

- Profiles at `/@handle`: name, a line about you, what you have written, and how many
  people you follow and are followed by.
- Following, and a feed that respects it. Two lists — the people you follow, and
  everyone — because a following-only feed cannot show you a first person to follow.
- Settings, where your name and your line can be changed. Your handle cannot.
- A three-column shell for the signed-in app: where you can go on the left, the feed
  in the middle, people and the rules on the right.

- You are told when something of yours is taken down, at the top of your own page,
  with the rule that was applied — not left to find it in the feed.
- Appeals. One level, a human, 48 hours, and the moderator who removed it cannot be
  the one who reads the objection to their own decision.
- In development, the login code appears on the login page as well as the terminal,
  so an account can be made without going to look for it.
- `pnpm moderator <email>` appoints or removes a moderator.

- A report button on every post and reply, with the rule you are reporting under
  named in plain language. Reporting the same thing twice does nothing, and you are
  told what happens next.
- A moderation queue for moderators: oldest first, the reported words in full, and
  two decisions — remove it, or leave it alone. Every decision is recorded against
  the moderator who made it.
- Removed content keeps its place in the thread and loses its words, with the rule
  that was applied shown where it used to be. Nothing disappears silently.

- Replies. Open a thread under any post, reply in up to 500 characters, delete your
  own. The reply count sits on the post, and a thread is only fetched once you open
  it.
- A feed. Write a post of up to 1,000 characters, read everyone else's newest first,
  and delete your own. No ranking, no scoring — the order is the order things were
  written in.

### Changed

- Liking and following happen the moment you click. The server confirms them; it no
  longer decides when the screen may change.
- Mona Sans throughout, one variable font doing both the text and the headings.

- The signed-in pages no longer carry the marketing header and footer, and the
  content is centred rather than pinned to the left edge.

- Only the part of a photo that crosses the line is blurred now, not the whole
  picture. A family at a walima is still a family at a walima.
- Instrumental music is stripped from an upload rather than muted. Vocals stay.
  Muted meant off for whoever found the setting and playing for everyone else.
- No city is named anywhere. Invites go out in groups so nobody arrives to an empty
  room, and that is all the page promises.
- The feed on the landing page is a stack rather than a list, which costs a third of
  the height and still shows every byline.
- Burgundy grounds are an aurora rather than a flat fill. Contrast was measured at
  the lightest point, not the average: white 6.9:1, dim 5.5:1, faint 4.7:1.

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
