<script lang="ts">
	import { decide, getQueue, getTally } from './queue.remote';
	import { ruleLabel } from '#lib/rules.js';

	const exact = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
	const count = new Intl.NumberFormat('en');

	const wording: Record<string, string> = {
		open: 'waiting',
		removed: 'removed',
		kept: 'left alone'
	};
</script>

<svelte:head>
	<title>Queue — Yuce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="grid max-w-[720px] gap-6 py-10">
	<header class="grid justify-items-start gap-2">
		<span class="label">Moderation</span>
		<h1 class="title">The queue</h1>
		<p class="sub measure">
			Oldest first, because the person who reported first has waited longest. Every decision is
			recorded with your name on it, and the monthly totals are published — including the ones we
			get wrong.
		</p>
	</header>

	<svelte:boundary>
		{#snippet pending()}
			<div class="sk h-4 w-48" aria-label="Counting"></div>
		{/snippet}
		<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
			{#each await getTally() as row (row.state)}
				<li class="chip">{count.format(row.n)} {wording[row.state] ?? row.state}</li>
			{:else}
				<li class="mono">Nothing reported yet.</li>
			{/each}
		</ul>
	</svelte:boundary>

	<svelte:boundary>
		{#snippet pending()}
			<div class="grid gap-3" aria-label="Loading the queue">
				{#each [1, 2] as n (n)}
					<div class="grid gap-2 card">
						<div class="sk h-4 w-40"></div>
						<div class="sk h-4 w-full"></div>
					</div>
				{/each}
			</div>
		{/snippet}

		{#each await getQueue() as item (item.id)}
			{@const settle = decide.for(item.id)}
			<article class="grid gap-3 card">
				<header class="flex flex-wrap items-baseline gap-2">
					<span class="title">{ruleLabel(item.rule)}</span>
					<span class="mono">
						{item.kind} by @{item.authorHandle ?? 'someone'} · reported by @{item.reporterHandle} ·
						{exact.format(item.createdAt)}
					</span>
				</header>

				{#if item.removedAt}
					<p class="mono">Already removed by an earlier decision.</p>
				{/if}

				<blockquote class="border-l-2 border-muted pl-3 whitespace-pre-wrap">
					{item.body ?? 'The content is gone — the author deleted it first.'}
				</blockquote>

				{#if item.note}
					<p class="sub">“{item.note}”</p>
				{/if}

				<form class="flex flex-wrap gap-2" {...settle}>
					<input {...settle.fields.id.as('hidden', item.id)} />
					<button
						class="btn-danger btn-sm"
						type="submit"
						name={settle.fields.verdict.as('submit', 'removed').name}
						value="removed"
						disabled={settle.pending > 0}
					>
						Remove it
					</button>
					<button
						class="btn btn-sm"
						type="submit"
						name={settle.fields.verdict.as('submit', 'kept').name}
						value="kept"
						disabled={settle.pending > 0}
					>
						Leave it alone
					</button>
				</form>

				{#each settle.fields.allIssues() ?? [] as issue (issue.message)}
					<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
				{/each}
			</article>
		{:else}
			<p class="sub">
				Nothing waiting. An empty queue is the goal, not a sign that nothing was reported.
			</p>
		{/each}
	</svelte:boundary>
</section>
