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
		},
		{
			name: 'Amina',
			handle: 'amina',
			when: '1h',
			body: 'Iftar at the community centre on Saturday — everyone is welcome, bring nothing.'
		}
	];

	const pledges = [
		['Chronological, and it ends', 'Nothing here is tuned to keep you scrolling.'],
		['No ads, no trackers', 'Not one line of third-party code. Nothing about you leaves.'],
		['The line is published', 'Halal and haram, in plain language, written before launch.']
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

{#snippet actions()}
	<div class="mt-1 flex items-center gap-5 border-t border-sunk pt-3">
		<span class="act">
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				aria-hidden="true"
			>
				<path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.5C19 15.5 12 20 12 20Z" />
			</svg>
			Like
		</span>
		<span class="act">
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.8"
				aria-hidden="true"
			>
				<path d="M20 12a7 7 0 0 1-9.9 6.4L5 20l1.6-4.5A7 7 0 1 1 20 12Z" stroke-linejoin="round" />
			</svg>
			Reply
		</span>
	</div>
{/snippet}

<!-- The pitch on one side, the thing itself on the other. -->
<section class="relative overflow-hidden">
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_78%_-10%,color-mix(in_oklab,var(--color-brand)_16%,transparent),transparent_60%)]"
	></div>
	<div
		class="pointer-events-none absolute -top-10 right-0 -z-10 h-[420px] w-[520px] khatam text-brand opacity-[0.07]"
	></div>

	<div
		class="wrap grid items-center gap-12 pt-12 pb-16 md:grid-cols-[1.02fr_0.98fr] md:gap-10 md:pt-20 md:pb-24"
	>
		<div class="grid justify-items-start gap-5">
			<span class="chip chip-on">Invite-only beta</span>
			<h1 class="big">
				Somewhere to talk that isn’t trying
				<em class="text-accent not-italic">to keep you there.</em>
			</h1>
			<p class="lead measure">
				Post, follow, comment, share. All of it ordinary. What is not ordinary is the line
				underneath: written on halal and haram, published in full, and held from the first week
				rather than the first crisis.
			</p>

			<form
				id="invite"
				class="mt-2 grid w-full max-w-[540px] scroll-mt-24 gap-2.5"
				{...joinWaitlist}
			>
				{#if joinWaitlist.result?.joined}
					<p
						class="rounded-md border border-accent bg-card px-4 py-3.5 text-[15px] font-medium"
						role="status"
					>
						You are on the list. We open one community at a time, and you will hear from us before
						anyone else in your city does.
					</p>
				{:else}
					<div
						class="flex flex-wrap gap-2 rounded-lg border border-muted bg-card p-2 shadow-[0_10px_30px_-18px_color-mix(in_oklab,var(--color-brand)_55%,transparent)]"
					>
						<label class="vh" for="email">Email address</label>
						<input
							class="field w-auto flex-[1_1_220px] border-transparent bg-transparent"
							id="email"
							{...joinWaitlist.fields.email.as('email')}
							required
							maxlength="254"
							autocomplete="email"
							placeholder="you@example.com"
						/>
						<label class="vh" for="city">City</label>
						<input
							class="field w-auto flex-[0_1_130px] border-transparent bg-transparent"
							id="city"
							{...joinWaitlist.fields.city.as('text')}
							maxlength="80"
							autocomplete="address-level2"
							placeholder="City"
						/>
						<button class="btn-solid flex-1" type="submit" disabled={joinWaitlist.pending > 0}>
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
		<div class="grid gap-3.5" aria-label="What the feed looks like">
			{#each demo as p, i (p.handle)}
				<article class="grid lift gap-2 {['md:mr-3', 'md:mr-1.5 md:ml-3.5', 'md:ml-7'][i]}">
					<header class="flex items-center gap-2.5">
						{@render avatar(p.name)}
						<span class="title">{p.name}</span>
						<span class="mono">@{p.handle} · {p.when}</span>
					</header>
					<p class="text-[15px]">{p.body}</p>
					{@render actions()}
				</article>
			{/each}
			<p class="mono pt-1 text-center">
				That is everyone you follow, up to now. The feed ends here.
			</p>
		</div>
	</div>
</section>

<!-- Three short pledges, not three more headings. -->
<section class="wrap">
	<div class="grid gap-px overflow-hidden rounded-lg border border-sunk bg-sunk md:grid-cols-3">
		{#each pledges as [head, body] (head)}
			<div class="grid content-start gap-1 bg-bg px-5 py-6">
				<h2 class="title">{head}</h2>
				<p class="sub">{body}</p>
			</div>
		{/each}
	</div>
</section>

<!-- The heaviest ground on the page, for the thing the product is actually about. -->
<section id="policy" class="relative mt-16 scroll-mt-20 overflow-hidden band md:mt-24">
	<div class="pointer-events-none absolute inset-0 khatam text-white opacity-[0.055]"></div>
	<div class="relative wrap grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_0.85fr] lg:gap-14">
		<div class="grid content-start justify-items-start gap-5">
			<h2>What does not belong here</h2>
			<p class="lead measure">
				Written down before launch rather than invented during an argument. One page, plain
				language, no clause that means the opposite of what it says.
			</p>
			<ul class="m-0 flex flex-wrap gap-2 p-0">
				{#each removed as r (r)}
					<li class="rounded-full border border-muted px-3.5 py-2 text-sm font-medium text-dim">
						{r}
					</li>
				{/each}
			</ul>
			<p class="measure mt-2 text-[17px] leading-[1.55] text-dim">
				<strong class="font-semibold text-ink">Gheebah is the one you will find hardest.</strong>
				Speaking ill of a named person behind their back, even when it is true. Every other platform calls
				that engagement and builds a feed out of it. Here it is removed — and that single rule is why
				this place will feel different within a week.
			</p>
		</div>

		<!-- Shown, not claimed: what a removal actually looks like. -->
		<div class="grid content-center gap-3">
			<article
				class="grid gap-2.5 rounded-md border border-white/25 bg-white/10 p-5 backdrop-blur-sm"
			>
				<header class="flex items-center gap-2.5">
					<span
						class="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/20 font-display text-sm font-semibold text-white"
						aria-hidden="true">H</span
					>
					<span class="title">A post from someone you follow</span>
				</header>
				<p class="text-[15px] text-white/65 line-through decoration-white/45">
					“You will not believe what <span class="text-white/45">[a named person]</span> did at the meeting
					—”
				</p>
				<p class="flex items-center gap-2 text-[13px] font-semibold">
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						aria-hidden="true"
					>
						<circle cx="12" cy="12" r="9" /><path d="m8.5 15.5 7-7" stroke-linecap="round" />
					</svg>
					Removed by a moderator
				</p>
				<p class="mono">
					Gheebah. True or not, it is still backbiting. The poster was told which rule and why.
				</p>
			</article>
			<p class="sub">
				Not hidden from you alone, not down-ranked quietly — gone, with a reason attached and an
				appeal a person reads.
			</p>
		</div>
	</div>
</section>

<!-- The other decision worth seeing rather than reading about. -->
<section class="wrap grid items-center gap-10 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-24">
	<div class="grid justify-items-start gap-4">
		<h2>Blurred, not deleted.</h2>
		<p class="lead measure">
			A photo over the modesty line is hidden behind a tap, not removed. Deleting it punishes a
			woman for being in a photograph and starts the same public argument every time. The blur is
			rendered on our server — the clear image is never sent to a screen that should not show it.
		</p>
		<p class="sub measure">
			Video and reels play silent until you say otherwise, and stay that way by default.
		</p>
	</div>

	<details class="group grid lift gap-3">
		<summary class="list-none [&::-webkit-details-marker]:hidden">
			<span class="grid gap-2.5">
				<span class="flex items-center gap-2.5">
					{@render avatar('Fariha')}
					<span class="title">Fariha</span>
					<span class="mono">@fariha.k · 12m</span>
				</span>
				<span class="block text-[15px]"
					>Cousin’s walima last night. Whole family in one frame for once.</span
				>
				<span class="veil h-44 cursor-pointer veil-mock group-open:[filter:none]">
					<span class="veil__note">
						<svg
							width="15"
							height="15"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							aria-hidden="true"
						>
							<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle
								cx="12"
								cy="12"
								r="2.6"
							/>
						</svg>
						<span class="group-open:hidden">Blurred · tap to see it</span>
						<span class="hidden group-open:inline">Hide it again</span>
					</span>
				</span>
			</span>
		</summary>
		<p class="mono">
			You chose to look. That is where modesty rules put the decision — on the one looking, not on
			the one in the photograph.
		</p>
	</details>
</section>

<!-- A real sequence, so it gets numbers. -->
<section id="how" class="scroll-mt-20 border-t border-sunk bg-sunk/40">
	<div class="wrap grid gap-9 py-16 md:py-24">
		<div class="grid justify-items-start gap-4">
			<h2>How a report is handled</h2>
			<p class="lead measure">
				Not a promise — a procedure, and a small one, because the small ones survive. Volunteers
				from the community read the queue, and removal counts are published every month, including
				the ones we got wrong.
			</p>
		</div>
		<ol class="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
			{#each steps as [t, d], i (t)}
				<li class="relative grid content-start gap-2 pt-5">
					<span class="absolute inset-x-0 top-0 h-px bg-muted"></span>
					<span class="absolute top-0 left-0 h-px w-8 bg-brand"></span>
					<span class="badge">{i + 1}</span>
					<h3 class="title">{t}</h3>
					<p class="sub">{d}</p>
				</li>
			{/each}
		</ol>
	</div>
</section>

<section class="relative overflow-hidden border-t border-sunk">
	<div class="pointer-events-none absolute inset-0 khatam text-brand opacity-[0.06]"></div>
	<div class="relative wrap grid justify-items-center gap-5 py-20 text-center md:py-28">
		<h2 class="max-w-[16ch]">Built in Dhaka, for wherever you are.</h2>
		<p class="lead max-w-[54ch]">
			One community at a time, because a feed of strangers is a graveyard and a feed of neighbours
			is worth opening. Tell us your city and we will come to it.
		</p>
		<a class="btn-solid mt-1" href="#invite">Request an invite</a>
	</div>
</section>
