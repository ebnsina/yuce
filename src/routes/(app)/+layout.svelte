<script lang="ts">
	import { page } from '$app/state';
	import { signOut } from '../login/auth.remote';
	import { whoToFollow } from './suggestions.remote';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const me = $derived(data.user!);
	const here = (path: string) => page.url.pathname === path;

	const links = $derived([
		{ href: '/home', label: 'Home', icon: 'M3 11.5 12 4l9 7.5M6 10v10h12V10' },
		{
			href: `/@${me.handle}`,
			label: 'Profile',
			icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0'
		},
		{
			href: '/settings',
			label: 'Settings',
			icon: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.9-1.1L14.4 3H9.6l-.3 2.9a7 7 0 0 0-1.9 1.1l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .7.1 1.1l-2 1.5 2 3.4 2.3-1c.6.5 1.2.8 1.9 1.1l.3 2.9h4.8l.3-2.9c.7-.3 1.3-.6 1.9-1.1l2.3 1 2-3.4-2-1.5c0-.4.1-.7.1-1.1Z'
		}
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
				<a
					class="side-link whitespace-nowrap {here(link.href) ? 'side-link--on' : ''}"
					href={link.href}
					aria-current={here(link.href) ? 'page' : undefined}
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d={link.icon} />
					</svg>
					{link.label}
				</a>
			{/each}
			{#if me.isModerator}
				<a
					class="side-link whitespace-nowrap {here('/moderation') ? 'side-link--on' : ''}"
					href="/moderation"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M12 3 20 6.5v5c0 5-3.4 8.3-8 9.5-4.6-1.2-8-4.5-8-9.5v-5L12 3Z" />
					</svg>
					Queue
				</a>
			{/if}
		</nav>

		<div class="mt-auto hidden lg:grid lg:gap-2 lg:pt-6">
			<a class="grid gap-0.5 rounded-md px-3 py-2 hover:bg-sunk" href="/@{me.handle}">
				<span class="title text-[15px]">{me.name}</span>
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
								<span class="title text-[15px]">{person.name}</span>
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
