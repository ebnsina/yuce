<script lang="ts">
	import { signOut } from '../login/auth.remote';
	import { createPost, deletePost, getFeed } from './feed.remote';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const when = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	const exact = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

	const units = [
		['year', 31_536_000],
		['month', 2_592_000],
		['week', 604_800],
		['day', 86_400],
		['hour', 3600],
		['minute', 60]
	] as const;

	function ago(date: Date) {
		const seconds = (Date.now() - date.getTime()) / 1000;
		for (const [unit, size] of units) {
			if (seconds >= size) return when.format(-Math.floor(seconds / size), unit);
		}
		return 'just now';
	}
</script>

<svelte:head>
	<title>Home — Yuce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="grid max-w-[620px] gap-6 py-10">
	<header class="flex flex-wrap items-center justify-between gap-3">
		<div class="grid gap-0.5">
			<h1 class="title">Assalamu alaikum, {data.user.name}</h1>
			<span class="mono">@{data.user.handle}</span>
		</div>
		<button class="btn btn-sm" onclick={() => signOut()} disabled={signOut.pending > 0}>
			Sign out
		</button>
	</header>

	<form class="grid gap-3 card" {...createPost}>
		<label class="vh" for="body">What are you writing?</label>
		<textarea
			class="min-h-[96px] field resize-y"
			id="body"
			{...createPost.fields.body.as('text')}
			maxlength="1000"
			placeholder="Say something worth someone's time."></textarea>
		{#each createPost.fields.allIssues() ?? [] as issue (issue.message)}
			<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
		{/each}
		<div class="flex items-center justify-between gap-3">
			<span class="mono">
				{1000 - (createPost.fields.body.value()?.length ?? 0)} left
			</span>
			<button class="btn-solid" type="submit" disabled={createPost.pending > 0}>
				{createPost.pending > 0 ? 'Posting…' : 'Post'}
			</button>
		</div>
	</form>

	<svelte:boundary>
		{#snippet pending()}
			<div class="grid gap-3" aria-label="Loading the feed">
				{#each [1, 2, 3] as n (n)}
					<div class="grid gap-2 card">
						<div class="sk h-4 w-32"></div>
						<div class="sk h-4 w-full"></div>
						<div class="sk h-4 w-2/3"></div>
					</div>
				{/each}
			</div>
		{/snippet}

		{#each await getFeed() as item (item.id)}
			<article class="grid gap-2 card">
				<header class="flex flex-wrap items-baseline gap-2">
					<span class="title">{item.authorName}</span>
					<span class="mono">@{item.authorHandle}</span>
					<time class="mono" datetime={item.createdAt.toISOString()}>
						{ago(item.createdAt)}
					</time>
				</header>
				<p class="whitespace-pre-wrap">{item.body}</p>
				{#if item.authorId === data.user.id}
					{@const form = deletePost.for(item.id)}
					<form class="justify-self-start" {...form}>
						<input {...form.fields.id.as('hidden', item.id)} />
						<button class="btn btn-sm" type="submit">Delete</button>
					</form>
				{/if}
				<span class="vh">{exact.format(item.createdAt)}</span>
			</article>
		{:else}
			<p class="sub">
				Nothing here yet. Whatever you write first sets the tone for everyone who arrives after you.
			</p>
		{/each}
	</svelte:boundary>
</section>
