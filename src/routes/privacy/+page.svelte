<script lang="ts">
	const title = 'Privacy — Yuce';
	const description =
		'What Yuce collects, what it refuses to collect, where it is kept and how to have it deleted. Written in plain language, with no clause that means the opposite of what it says.';
	const updated = '17 September 2026';

	const never = [
		[
			'Sell or share your data',
			'Not to advertisers, not to brokers, not to anyone. There is no arrangement under which this happens.'
		],
		[
			'Put third-party code in the app',
			'No analytics SDK, no ad network, no crash reporter, no social login button phoning home. Fonts are served from our own machine, so even loading the page tells no one else you were here.'
		],
		[
			'Keep a history of where you have been',
			'When the app one day shows prayer times or a mosque nearby, the calculation happens on your device. A location we never store cannot be leaked, sold or handed over.'
		],
		[
			'Build a profile of your religious practice',
			'What you read, how often you open the app, what you pray — none of it is tracked, scored or fed to anything.'
		]
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:site_name" content="Yuce" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<section class="relative overflow-hidden">
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_78%_-10%,color-mix(in_oklab,var(--color-brand)_16%,transparent),transparent_60%)]"
	></div>
	<div
		class="pointer-events-none absolute -top-10 right-0 -z-10 h-[420px] w-[520px] khatam text-brand opacity-[0.07]"
	></div>
	<article class="wrap grid justify-items-start gap-6 pt-14 pb-12 md:pt-20 md:pb-16">
		<span class="chip chip-on">Updated {updated}</span>
		<h1 class="big">Privacy</h1>
		<p class="lead measure">
			A record of who prays, and where, is the kind of thing that gets people hurt. So this page is
			short, specific, and written to be held against us. If something here stops being true, it
			changes on the same day.
		</p>
	</article>
</section>

<section class="wrap grid gap-7 py-11 md:py-16">
	<div class="grid justify-items-start gap-3">
		<h2>Everything we hold right now</h2>
		<p class="lead measure">
			Yuce is not open yet. There are no accounts, no posts and no feed, so there is very little to
			describe — and this is the moment to write it down honestly rather than after the fact.
		</p>
	</div>

	<div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-3.5">
		<article class="grid lift content-start gap-2">
			<h3 class="title">Your email address</h3>
			<p class="sub">
				Because you asked for an invite, and an invite has to reach you somewhere. It is used for
				that and nothing else. No newsletter, no announcements, no “we thought you’d like”.
			</p>
		</article>
		<article class="grid lift content-start gap-2">
			<h3 class="title">Your city, if you gave one</h3>
			<p class="sub">
				Invites go out in groups so nobody arrives to an empty room, and a city is how we group
				them. It is the name you typed — a city, not a location, not a coordinate, not anything your
				phone told us.
			</p>
		</article>
		<article class="grid lift content-start gap-2">
			<h3 class="title">The date you asked</h3>
			<p class="sub">
				So the list stays in order and the people who asked first are invited first. That is the
				whole of it. Three fields, and you typed two of them.
			</p>
		</article>
	</div>
</section>

<section class="relative mt-6 overflow-hidden band">
	<div class="pointer-events-none absolute inset-0 khatam text-white opacity-[0.09]"></div>
	<div class="relative wrap grid gap-8 py-16 md:py-20">
		<div class="grid justify-items-start gap-3">
			<h2>What we will not do</h2>
			<p class="lead measure">
				Promises are cheap, so these are written as things the app is structurally unable to do
				rather than things we intend to avoid. Data that is never collected cannot be sold, leaked,
				or handed to someone with a warrant.
			</p>
		</div>
		<ol class="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
			{#each never as [t, d], i (t)}
				<li class="flex items-start gap-3">
					<span class="badge">{i + 1}</span>
					<div class="grid gap-1">
						<h3 class="title">{t}</h3>
						<p class="sub">{d}</p>
					</div>
				</li>
			{/each}
		</ol>
	</div>
</section>

<section class="wrap grid gap-7 py-14 md:py-20">
	<div class="grid justify-items-start gap-3">
		<h2>The part we are not finished with</h2>
	</div>
	<div class="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] items-start gap-3.5">
		<article class="grid lift content-start gap-2 ring-[1.5px] ring-accent ring-inset">
			<h3 class="title">The waitlist sits on US-hosted infrastructure</h3>
			<p class="sub">
				It is a managed Postgres database run by an American company. For a list of email addresses
				during a closed beta we think that is an acceptable trade, and we would rather say so than
				let you assume otherwise. Before accounts open — before there is anything to read about a
				person — we will publish exactly where the data lives and under whose law. If that turns out
				to be somewhere you are not comfortable with, you will know before you post anything.
			</p>
		</article>
		<div class="grid gap-3.5">
			<article class="grid lift content-start gap-2">
				<h3 class="title">How long we keep it</h3>
				<p class="sub">
					Until you are invited and have an account, or until you ask us to delete it, or until we
					give up on opening near you — whichever comes first.
				</p>
			</article>
			<article class="grid lift content-start gap-2">
				<h3 class="title">Who else can see it</h3>
				<p class="sub">
					The people building Yuce, and the database provider that stores it. Nobody else has been
					given access, and nobody has asked.
				</p>
			</article>
		</div>
	</div>
</section>

<section class="wrap grid gap-7 pb-14 md:pb-20">
	<div class="grid justify-items-start gap-3">
		<h2>Getting your data back, or gone</h2>
		<p class="lead measure">
			Email <a class="link" href="mailto:privacy@yuce.app">privacy@yuce.app</a> and ask. We will tell
			you everything we hold about you, or delete it, within seven days — and deleted means the row is
			gone, not flagged as hidden. No form, no retention offer, no asking why.
		</p>
		<p class="sub measure">
			When accounts exist this becomes a button in your settings: one tap to export everything, one
			tap to delete the account and everything in it. Until then, a human reads the email.
		</p>
	</div>
</section>

<section class="relative overflow-hidden border-t border-sunk">
	<div class="pointer-events-none absolute inset-0 khatam text-brand opacity-[0.06]"></div>
	<div class="relative wrap grid justify-items-center gap-5 py-20 text-center md:py-24">
		<h2 class="max-w-[22ch]">If this page ever gets longer, read it again.</h2>
		<p class="lead max-w-[54ch]">
			Privacy policies grow when someone has found a new use for your data. This one is dated at the
			top, and any change will say what changed and why.
		</p>
		<a class="btn-solid mt-1" href="/#invite">Request an invite</a>
	</div>
</section>
