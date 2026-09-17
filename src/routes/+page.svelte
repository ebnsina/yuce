<script lang="ts">
	import { joinWaitlist } from './waitlist.remote';
	import { waitingCount } from './stats.remote';

	const title = 'Yuce — a social network with a halal line';
	const description =
		'Post, follow, comment. No algorithm, no ads, no trackers, and a content policy written on halal and haram rather than on what keeps advertisers comfortable. Invite-only beta.';

	// Invented people, to show the shape of a feed rather than to suggest anyone is here.
	const demo = [
		{
			name: 'Nusaybah',
			handle: 'nusaybah',
			when: '4m',
			body: 'Fajr jamaat at the masjid on 12th moved to 5:10. Third change this month — trust the timetable on the wall, not the app.'
		},
		{
			name: 'Bilal',
			handle: 'bilal.r',
			when: '22m',
			body: 'Finished Surah Al-Kahf with my daughter tonight. She corrected me twice. Never been happier to be wrong.'
		}
	];

	const principles = [
		['No algorithm', 'Chronological, and it ends. Nothing here is tuned to keep you.'],
		['No ads, no trackers', 'Not one line of third-party code. Nothing about you leaves.'],
		['One line, written down', 'Halal and haram, in plain language, published before launch.']
	];

	const removed = [
		'Nudity',
		'Gheebah',
		'Slander',
		'Takfir and sect-bashing',
		'Alcohol, pork, gambling',
		'Riba',
		'Dating',
		'Fabricated hadith'
	];

	const steps = [
		['Report', 'One button on every post, comment and profile. One queue behind it.'],
		['Review', 'A person reads it. Spam and pornography are caught by machine first.'],
		['Act', 'Removed, blurred behind a tap, or left alone — and the poster is told which.'],
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

{#snippet avatar(name: string)}
	<span
		class="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand font-display text-sm font-semibold text-on-brand"
		aria-hidden="true"
	>
		{name[0]}
	</span>
{/snippet}

<!-- The pitch on one side, the thing itself on the other. -->
<section
	class="grid items-center gap-10 pt-10 pb-14 md:grid-cols-[1.05fr_0.95fr] md:pt-16 md:pb-20"
>
	<div class="grid justify-items-start gap-5">
		<span class="chip chip-on">Invite-only beta</span>
		<h1 class="big">
			Somewhere to talk that isn’t trying
			<em class="text-accent not-italic">to keep you there.</em>
		</h1>
		<p class="lead measure">
			Post, follow, comment, share. All of it ordinary. What is not ordinary is the line underneath:
			written on halal and haram, published in full, and held from the first week rather than the
			first crisis.
		</p>

		<form id="invite" class="mt-1 grid w-full max-w-[520px] gap-2.5" {...joinWaitlist}>
			{#if joinWaitlist.result?.joined}
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
						class="field w-auto flex-[1_1_220px]"
						id="email"
						{...joinWaitlist.fields.email.as('email')}
						required
						maxlength="254"
						autocomplete="email"
						placeholder="you@example.com"
					/>
					<label class="vh" for="city">City</label>
					<input
						class="field w-auto flex-[0_1_130px]"
						id="city"
						{...joinWaitlist.fields.city.as('text')}
						maxlength="80"
						autocomplete="address-level2"
						placeholder="City"
					/>
					<button class="btn-solid" type="submit" disabled={joinWaitlist.pending > 0}>
						{joinWaitlist.pending > 0 ? 'Sending…' : 'Request invite'}
					</button>
				</div>
				{#each joinWaitlist.fields.allIssues() ?? [] as issue (issue.message)}
					<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
				{/each}
				<p class="mono">
					Dhaka first. No marketing email, ever — only your invite.
					<svelte:boundary>
						{#if (await waitingCount()) > 0}
							· <span class="num text-ink">{await waitingCount()}</span> waiting
						{/if}
					</svelte:boundary>
				</p>
			{/if}
		</form>
	</div>

	<!-- Not a screenshot: the real components, with invented people in them. -->
	<div class="grid gap-3" aria-label="What the feed looks like">
		{#each demo as p (p.handle)}
			<article class="grid gap-2 card">
				<header class="flex items-center gap-2.5">
					{@render avatar(p.name)}
					<span class="title">{p.name}</span>
					<span class="mono">@{p.handle} · {p.when}</span>
				</header>
				<p>{p.body}</p>
			</article>
		{/each}

		<article class="grid gap-2 card">
			<header class="flex items-center gap-2.5">
				{@render avatar('Amina')}
				<span class="title">Amina</span>
				<span class="mono">@amina · 1h</span>
			</header>
			<p>Iftar at the community centre on Saturday — everyone is welcome.</p>
			<div class="veil h-32 bg-[linear-gradient(120deg,var(--color-sunk),var(--color-muted))]">
				<span class="veil__note">Blurred · tap to see it</span>
			</div>
			<p class="mono">Anything that moves plays silent until you say otherwise.</p>
		</article>

		<article class="grid gap-2 card border border-danger">
			<span class="label">Removed by a moderator</span>
			<p class="sub">
				“You will not believe what <span class="text-faint">[a named person]</span> did at the meeting
				—”
			</p>
			<p class="mono">Gheebah. True or not, it is still backbiting.</p>
		</article>
	</div>
</section>

<div class="rule"></div>

<section class="grid gap-6 py-12 md:grid-cols-3 md:py-16">
	{#each principles as [head, body] (head)}
		<div class="grid content-start gap-1.5">
			<h2 class="title">{head}</h2>
			<p class="sub">{body}</p>
		</div>
	{/each}
</section>

<section id="policy" class="grid gap-7 border-t border-sunk py-12 md:py-20">
	<div class="grid justify-items-start gap-3">
		<span class="label">The line</span>
		<h2>What does not belong here</h2>
		<p class="lead measure">
			Written down before launch rather than invented during an argument. One page, plain language,
			no clause that means the opposite of what it says.
		</p>
	</div>

	<ul class="m-0 flex flex-wrap gap-2 p-0">
		{#each removed as r (r)}
			<li class="rounded-full border border-muted px-3.5 py-2 text-sm font-medium text-dim">{r}</li>
		{/each}
	</ul>

	<p class="lead measure">
		<strong class="text-ink">Gheebah is the one you will find hardest.</strong> Speaking ill of a named
		person behind their back, even when it is true. Every other platform calls that engagement and builds
		a feed out of it. Here it is removed — and that single rule is why this place will feel different
		within a week.
	</p>
</section>

<section id="how" class="grid gap-7 border-t border-sunk py-12 md:py-20">
	<div class="grid justify-items-start gap-3">
		<span class="label">Moderation</span>
		<h2>How it actually works</h2>
		<p class="lead measure">
			Not a promise — a procedure, and a small one, because the small ones survive. Volunteers from
			the community read the queue, and removal counts are published every month, including the ones
			we got wrong.
		</p>
	</div>
	<ol class="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
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

<section class="grid justify-items-start gap-4.5 border-t border-sunk py-12 md:py-20">
	<h2>Built in Dhaka, for wherever you are.</h2>
	<p class="lead measure">
		One community at a time, because a feed of strangers is a graveyard and a feed of neighbours is
		worth opening. Tell us your city and we will come to it.
	</p>
	<a class="btn-solid" href="#invite">Request an invite</a>
</section>
