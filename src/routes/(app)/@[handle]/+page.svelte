<script lang="ts">
	import { page } from '$app/state';
	import { ruleLabel } from '#lib/rules.js';
	import { getPostsBy, getProfile, toggleBlock, toggleFollow } from './profile.remote';

	const handle = $derived(page.params.handle!);
	const joined = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
	const exact = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
	const count = new Intl.NumberFormat('en');
	const plural = new Intl.PluralRules('en');
	const many = (n: number, one: string, more: string) =>
		`${count.format(n)} ${plural.select(n) === 'one' ? one : more}`;
</script>

<svelte:head>
	<title>@{handle} — Yuce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="grid gap-6">
	<svelte:boundary>
		{#snippet pending()}
			<div class="grid gap-2" aria-label="Loading the profile">
				<div class="sk h-8 w-48"></div>
				<div class="sk h-4 w-64"></div>
			</div>
		{/snippet}

		{@const person = await getProfile(handle)}
		<header class="grid justify-items-start gap-3">
			<div class="grid gap-0.5">
				<h1 class="title">{person.name}</h1>
				<span class="mono">@{person.handle} · here since {joined.format(person.joinedAt)}</span>
			</div>
			{#if person.bio}
				<p class="sub measure">{person.bio}</p>
			{/if}
			<p class="mono">
				{many(person.posts, 'post', 'posts')} · {many(person.followers, 'follower', 'followers')} ·
				{count.format(person.following)} following
			</p>
			{#if person.isMe}
				<a class="btn btn-sm" href="/settings">Edit your profile</a>
			{:else}
				<div class="flex flex-wrap gap-2">
					{#if !person.hidden}
						<button
							class={person.followed ? 'btn btn-sm' : 'btn-solid btn-sm'}
							onclick={() => toggleFollow(handle)}
							disabled={toggleFollow.pending > 0}
						>
							{person.followed ? 'Following' : 'Follow'}
						</button>
					{/if}
					<button
						class="btn btn-sm"
						onclick={() => toggleBlock(handle)}
						disabled={toggleBlock.pending > 0}
					>
						{person.blocked ? 'Unblock' : 'Block'}
					</button>
				</div>
				{#if person.hidden}
					<p class="sub measure">
						{person.blocked
							? 'You have blocked this person. Neither of you sees the other, and the follow in either direction is gone.'
							: 'There is a block between you. Neither of you sees the other.'}
					</p>
				{/if}
			{/if}
		</header>
	</svelte:boundary>

	<div class="rule"></div>

	<svelte:boundary>
		{#snippet pending()}
			<div class="grid gap-3" aria-label="Loading posts">
				{#each [1, 2] as n (n)}
					<div class="grid gap-2 card"><div class="sk h-4 w-full"></div></div>
				{/each}
			</div>
		{/snippet}

		{#each await getPostsBy(handle) as item (item.id)}
			<article class="grid gap-2 card">
				<time class="mono" datetime={item.createdAt.toISOString()}
					>{exact.format(item.createdAt)}</time
				>
				{#if item.body === null}
					<p class="sub">Removed by a moderator — {ruleLabel(item.removedReason ?? 'other')}.</p>
				{:else}
					<p class="whitespace-pre-wrap">{item.body}</p>
				{/if}
			</article>
		{:else}
			<p class="sub">Nothing written yet.</p>
		{/each}
	</svelte:boundary>
</section>
