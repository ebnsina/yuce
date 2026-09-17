<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import IconSearch from '~icons/hugeicons/search-01';
	import IconHeart from '~icons/hugeicons/favourite';
	import IconReply from '~icons/hugeicons/bubble-chat';
	import { findPeople, findPosts, recentVoices } from './search.remote';

	const text = $derived(page.url.searchParams.get('q') ?? '');
	const count = new Intl.NumberFormat('en');
	const when = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

	// Writable derived: the box follows the URL, and typing overrides it until the
	// next navigation.
	let typed = $derived(text);

	function run(event: SubmitEvent) {
		event.preventDefault();
		const next = typed.trim();
		goto(next ? `/search?q=${encodeURIComponent(next)}` : '/search');
	}
</script>

<svelte:head>
	<title>{text ? `${text} — search` : 'Search'} — Yuce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="grid gap-6">
	<h1 class="title">Search</h1>

	<form class="flex gap-2" onsubmit={run}>
		<label class="vh" for="q">Search people and posts</label>
		<input
			class="field"
			id="q"
			name="q"
			type="search"
			bind:value={typed}
			placeholder="A name, a handle, or a word someone wrote"
			maxlength="80"
		/>
		<button class="btn-solid" type="submit">
			<IconSearch class="size-4" />
			Search
		</button>
	</form>

	{#if text.length < 2}
		<svelte:boundary>
			{#snippet pending()}<div class="sk h-4 w-40"></div>{/snippet}
			<div class="grid gap-3">
				<h2 class="label">Newest here</h2>
				{#each await recentVoices() as person (person.handle)}
					<a class="grid gap-0.5" href="/@{person.handle}">
						<span class="title text-[15px]">{person.name}</span>
						<span class="mono">@{person.handle}</span>
					</a>
				{:else}
					<p class="sub">Nobody else yet.</p>
				{/each}
			</div>
		</svelte:boundary>
	{:else}
		<svelte:boundary>
			{#snippet pending()}<div class="sk h-4 w-40" aria-label="Searching people"></div>{/snippet}
			{#if (await findPeople(text)).length}
				<div class="grid gap-3">
					<h2 class="label">People</h2>
					{#each await findPeople(text) as person (person.handle)}
						<a class="grid gap-0.5 card" href="/@{person.handle}">
							<span class="title text-[15px]">{person.name}</span>
							<span class="mono">
								@{person.handle} · {count.format(person.posts)}
								{person.posts === 1 ? 'post' : 'posts'}
							</span>
							{#if person.bio}<span class="sub">{person.bio}</span>{/if}
						</a>
					{/each}
				</div>
			{/if}
		</svelte:boundary>

		<svelte:boundary>
			{#snippet pending()}<div class="sk h-4 w-40" aria-label="Searching posts"></div>{/snippet}
			{#if (await findPosts(text)).length}
				<div class="grid gap-3">
					<h2 class="label">Posts</h2>
					{#each await findPosts(text) as item (item.id)}
						<article class="grid gap-2 card">
							<header class="flex flex-wrap items-baseline gap-2">
								<a class="title" href="/@{item.authorHandle}">{item.authorName}</a>
								<span class="mono">@{item.authorHandle} · {when.format(item.createdAt)}</span>
							</header>
							<p class="whitespace-pre-wrap">{item.body}</p>
							<p class="mono flex items-center gap-3">
								<span class="flex items-center gap-1"
									><IconHeart class="size-3.5" />{item.likes}</span
								>
								<span class="flex items-center gap-1"
									><IconReply class="size-3.5" />{item.replies}</span
								>
							</p>
						</article>
					{/each}
				</div>
			{/if}
		</svelte:boundary>

		<svelte:boundary>
			{#snippet pending()}{/snippet}
			{#if !(await findPeople(text)).length && !(await findPosts(text)).length}
				<p class="sub">
					Nothing for “{text}”. Search looks at names, handles and the words in posts.
				</p>
			{/if}
		</svelte:boundary>
	{/if}
</section>
