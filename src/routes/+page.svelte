<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let sending = $state(false);

	const title = 'Yuce — a social network with a halal line';
	const description =
		'Post, follow, comment. No algorithm, no ads, no trackers, and a content policy written on halal and haram rather than on what keeps advertisers comfortable. Invite-only beta.';

	const removed = [
		'Nudity and sexual content',
		'Gheebah — backbiting a named person',
		'Slander and rumour',
		'Takfir and sect-bashing',
		'Alcohol, pork, gambling, drugs',
		'Riba — interest-based lending ads',
		'Dating and flirtation',
		'Fabricated hadith and unsourced rulings'
	];

	const principles = [
		{
			n: '01',
			t: 'No algorithm. No infinite scroll.',
			d: 'A chronological feed of the people you follow, and one daily digest. You will reach the end, and then you will put your phone down. Nothing here is tuned to keep you.'
		},
		{
			n: '02',
			t: 'No ads. No trackers. Not one.',
			d: 'There is no third-party code in this app. No analytics SDK, no ad network, no crash reporter carrying your data off. A prayer app sold its users’ location to a defence contractor in 2020. We cannot do that, because we never collect it.'
		},
		{
			n: '03',
			t: 'Moderated on halal and haram.',
			d: 'Every platform moderates. They just moderate for advertisers. Ours is written against a different standard, published in plain language, and enforced the same way for everyone.'
		}
	];

	const steps = [
		[
			'Report',
			'Every post, comment and profile has a report button. One queue, no triage theatre.'
		],
		[
			'Review',
			'A person reads it. Obvious spam and pornography are caught before that by machine.'
		],
		['Act', 'Removed, or blurred behind a tap, or left alone. The poster is told which, and why.'],
		['Appeal', 'One level, a human, within 48 hours. You are not arguing with a form.']
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:site_name" content="Yuce" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>

<div class="mx-auto max-w-[1080px] px-5">
	<header class="flex items-center justify-between gap-4 py-6">
		<a href="/" class="font-display text-[22px] font-semibold tracking-[-0.04em] text-ink">yuce</a>
		<nav class="flex items-center gap-1">
			<a class="side-link max-sm:hidden" href="#policy">The line</a>
			<a class="side-link max-sm:hidden" href="#how">Moderation</a>
			<a class="btn btn-sm" href="#invite">Request an invite</a>
		</nav>
	</header>

	<main>
		<section class="grid justify-items-start gap-6 pt-12 pb-10 md:pt-24 md:pb-20">
			<span class="chip chip-on">Invite-only beta</span>
			<h1 class="big">
				A social network<br />with a line it will<br /><em class="text-accent not-italic"
					>actually hold.</em
				>
			</h1>
			<p class="lead measure">
				Post, follow, comment, share. The ordinary things. What is not ordinary is the policy
				underneath: written on halal and haram, published in full, and enforced from the first week
				rather than the first crisis.
			</p>

			<form
				id="invite"
				class="mt-2 grid w-full max-w-[620px] gap-2.5"
				method="POST"
				action="?/join"
				use:enhance={() => {
					sending = true;
					return async ({ update }) => {
						await update();
						sending = false;
					};
				}}
			>
				{#if form?.joined}
					<p
						class="rounded-md border border-accent px-4 py-3.5 text-[15px] font-medium"
						role="status"
					>
						You are on the list. We open one community at a time, and you will hear from us before
						anyone else in your city does.
					</p>
				{:else}
					<div class="flex flex-wrap gap-2">
						<label class="vh" for="email">Email address</label>
						<input
							class="field w-auto flex-[1_1_240px]"
							id="email"
							name="email"
							type="email"
							required
							maxlength="254"
							autocomplete="email"
							placeholder="you@example.com"
							value={form?.email ?? ''}
							aria-invalid={form?.error ? 'true' : undefined}
						/>
						<label class="vh" for="city">City</label>
						<input
							class="field w-auto flex-[0_1_140px]"
							id="city"
							name="city"
							type="text"
							maxlength="80"
							autocomplete="address-level2"
							placeholder="City"
						/>
						<button class="btn-solid" type="submit" disabled={sending}>
							{sending ? 'Sending…' : 'Request invite'}
						</button>
					</div>
					{#if form?.error}
						<p class="text-sm font-semibold text-danger" role="alert">{form.error}</p>
					{/if}
					<p class="mono">Dhaka first. No marketing email, ever — only your invite.</p>
				{/if}
			</form>
		</section>

		<div class="rule"></div>

		<section class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 py-10 md:py-16">
			{#each principles as p (p.n)}
				<article class="grid content-start gap-2 card">
					<span class="label">{p.n}</span>
					<h3 class="title">{p.t}</h3>
					<p class="sub">{p.d}</p>
				</article>
			{/each}
		</section>

		<section id="policy" class="grid gap-7 py-11 md:py-20">
			<div class="grid justify-items-start gap-3">
				<span class="label">The line</span>
				<h2>What does not belong here</h2>
				<p class="lead measure">
					Written down before launch rather than invented during an argument. The full policy is one
					page, in plain language, with no clause that means the opposite of what it says.
				</p>
			</div>

			<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
				{#each removed as r (r)}
					<li class="rounded-full border border-muted px-3.5 py-2 text-sm font-medium text-dim">
						{r}
					</li>
				{/each}
			</ul>

			<div class="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] items-start gap-3">
				<article class="grid content-start gap-2 card ring-[1.5px] ring-accent ring-inset">
					<span class="label">The unusual one</span>
					<h3 class="title">Gheebah</h3>
					<p class="sub">
						Speaking ill of a named, identifiable person behind their back — even when it is true.
						Every other platform calls this engagement and builds a feed around it. We treat it as
						what it is, and remove it. This is the rule you will find hardest, and the reason this
						place feels different within a week.
					</p>
				</article>
				<div class="grid gap-3">
					<article class="grid content-start gap-2 card">
						<h3 class="title">Audio is muted by default</h3>
						<p class="sub">
							We take no position on music. Video plays silent, and there is one setting that keeps
							it that way for good. Unmuting is your choice, made once, by you.
						</p>
					</article>
					<article class="grid content-start gap-2 card">
						<h3 class="title">Blurred, not deleted</h3>
						<p class="sub">
							A photo past the modesty line is hidden behind a tap rather than erased, and the
							person who posted it is not punished for appearing in it. Lowering the gaze was always
							an instruction to the one looking.
						</p>
					</article>
				</div>
			</div>
		</section>

		<section id="how" class="grid gap-7 py-11 md:py-20">
			<div class="grid justify-items-start gap-3">
				<span class="label">Moderation</span>
				<h2>How it actually works</h2>
				<p class="lead measure">
					Not a promise — a procedure, and a small one, because the ones that survive are small.
					Volunteers from the community read the queue. Removal counts are published every month,
					including the ones we got wrong.
				</p>
			</div>
			<ol class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-5 p-0">
				{#each steps as [t, d], i (t)}
					<li class="flex items-start gap-3">
						<span class="badge">{i + 1}</span>
						<div class="grid gap-1">
							<h3 class="title">{t}</h3>
							<p class="sub">{d}</p>
						</div>
					</li>
				{/each}
			</ol>
		</section>

		<section class="grid justify-items-start gap-4.5 border-t border-sunk py-12 md:py-24">
			<h2>Built in Dhaka, for wherever you are.</h2>
			<p class="lead measure">
				We open one community at a time, because a feed of strangers is a graveyard and a feed of
				neighbours is worth opening. Tell us your city and we will come to it.
			</p>
			<a class="btn-solid" href="#invite">Request an invite</a>
		</section>
	</main>

	<footer class="flex flex-wrap items-center justify-between gap-3 border-t border-sunk pt-7 pb-10">
		<span class="mono">Yuce — <span lang="tr">yüce</span>, exalted.</span>
		<nav class="flex flex-wrap gap-4 text-sm">
			<a class="link" href="#policy">Content policy</a>
			<a class="link" href="#how">Moderation</a>
			<a class="link" href="/privacy">Privacy</a>
		</nav>
	</footer>
</div>
