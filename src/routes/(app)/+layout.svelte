<script lang="ts">
	import { page } from '$app/state';
	import IconHome from '~icons/hugeicons/home-01';
	import IconUser from '~icons/hugeicons/user';
	import IconSettings from '~icons/hugeicons/settings-02';
	import IconSearch from '~icons/hugeicons/search-01';
	import IconShield from '~icons/hugeicons/shield-01';
	import { signOut } from '../login/auth.remote';
	import { whoToFollow } from './suggestions.remote';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const me = $derived(data.user!);
	const here = (path: string) => page.url.pathname === path;

	const links = $derived([
		{ href: '/home', label: 'Home', icon: IconHome },
		{ href: `/@${me.handle}`, label: 'Profile', icon: IconUser },
		{ href: '/search', label: 'Search', icon: IconSearch },
		{ href: '/settings', label: 'Settings', icon: IconSettings }
	]);
</script>

<div
	class="mx-auto grid w-full max-w-[1200px] gap-6 px-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]"
>
	<!-- Left: where you can go. Sticky, because a feed is long and a rail should not be. -->
	<aside class="lg:sticky lg:top-0 lg:h-dvh lg:py-5">
		<div class="flex items-center gap-2.5 py-4 lg:pb-6">
			<a href="/home" class="flex items-center gap-2.5">
				<span class="grid h-8 w-8 place-items-center rounded-md bg-brand">
					<span class="h-5 w-5 khatam text-on-brand"></span>
				</span>
				<span class="font-display text-[20px] font-semibold tracking-[-0.04em] text-ink">yuce</span>
			</a>
		</div>

		<nav class="flex gap-1 overflow-x-auto pb-3 lg:grid lg:gap-0.5 lg:overflow-visible lg:pb-0">
			{#each links as link (link.href)}
				{@const Icon = link.icon}
				<a
					class="side-link whitespace-nowrap {here(link.href) ? 'side-link--on' : ''}"
					href={link.href}
					aria-current={here(link.href) ? 'page' : undefined}
				>
					<Icon class="size-[18px]" />
					{link.label}
				</a>
			{/each}
			{#if me.isModerator}
				<a
					class="side-link whitespace-nowrap {here('/moderation') ? 'side-link--on' : ''}"
					href="/moderation"
				>
					<IconShield class="size-[18px]" />
					Queue
				</a>
			{/if}
		</nav>

		<div class="mt-auto hidden lg:grid lg:gap-2 lg:pt-6">
			<a class="grid gap-0.5 rounded-md px-3 py-2 hover:bg-sunk" href="/@{me.handle}">
				<span class="title">{me.name}</span>
				<span class="mono">@{me.handle}</span>
			</a>
			<button class="btn btn-sm" onclick={() => signOut()} disabled={signOut.pending > 0}>
				Sign out
			</button>
		</div>
	</aside>

	<!-- Middle: the only column that scrolls with anything in it. -->
	<main class="min-w-0 border-x-0 border-sunk py-6 lg:border-x lg:px-6">{@render children()}</main>

	<!-- Right: people, and the rules. Hidden below xl rather than squashed. -->
	<aside class="hidden xl:sticky xl:top-0 xl:block xl:h-dvh xl:overflow-y-auto xl:py-6">
		<div class="grid gap-4">
			<svelte:boundary>
				{#snippet pending()}
					<div class="grid gap-2 card"><div class="sk h-4 w-32"></div></div>
				{/snippet}
				{#if (await whoToFollow()).length}
					<section class="grid gap-3 card">
						<h2 class="label">People here</h2>
						{#each await whoToFollow() as person (person.handle)}
							<a class="grid gap-0.5" href="/@{person.handle}">
								<span class="title">{person.name}</span>
								<span class="mono">
									@{person.handle} · {person.posts}
									{person.posts === 1 ? 'post' : 'posts'}
								</span>
								{#if person.bio}
									<span class="sub line-clamp-2">{person.bio}</span>
								{/if}
							</a>
						{/each}
					</section>
				{/if}
			</svelte:boundary>

			<section class="grid gap-2 card">
				<h2 class="label">The line</h2>
				<p class="sub">
					No algorithm. No ads. Backbiting a named person is removed, even when it is true.
				</p>
				<a class="link text-sm" href="/#policy">Read the policy</a>
			</section>

			<p class="mono">
				<a class="link" href="/privacy">Privacy</a> · <a class="link" href="/#how">Moderation</a>
			</p>
		</div>
	</aside>
</div>
