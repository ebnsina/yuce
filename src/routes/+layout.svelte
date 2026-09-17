<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="mx-auto max-w-[1080px] px-5">
	<header class="flex items-center justify-between gap-4 py-6">
		<a href="/" class="font-display text-[22px] font-semibold tracking-[-0.04em] text-ink">yuce</a>
		<nav class="flex items-center gap-1">
			<a class="side-link max-sm:hidden" href="/#policy">The line</a>
			<a class="side-link max-sm:hidden" href="/#how">Moderation</a>
			<a class="btn btn-sm" href="/#invite">Request an invite</a>
		</nav>
	</header>

	<main>{@render children()}</main>

	<footer class="flex flex-wrap items-center justify-between gap-3 border-t border-sunk pt-7 pb-10">
		<span class="mono">Yuce — <span lang="tr">yüce</span>, exalted.</span>
		<nav class="flex flex-wrap gap-4 text-sm">
			<a class="link" href="/#policy">Content policy</a>
			<a class="link" href="/#how">Moderation</a>
			<a class="link" href="/privacy">Privacy</a>
		</nav>
	</footer>
</div>
