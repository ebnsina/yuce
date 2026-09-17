<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<header
	class="sticky top-0 z-50 border-b border-transparent bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70"
>
	<div class="wrap flex items-center justify-between gap-4 py-4">
		<a
			href="/"
			class="flex items-center gap-2.5 font-display text-[22px] font-semibold tracking-[-0.04em] text-ink"
		>
			<span class="relative grid h-7 w-7 place-items-center overflow-hidden rounded-[9px] bg-brand">
				<span class="absolute inset-0 khatam text-white opacity-45"></span>
			</span>
			yuce
		</a>
		<nav class="flex items-center gap-1">
			<a class="side-link max-sm:hidden" href="/#policy">The line</a>
			<a class="side-link max-sm:hidden" href="/#how">Moderation</a>
			<a class="btn btn-sm" href="/#invite">Request an invite</a>
		</nav>
	</div>
</header>

<main>{@render children()}</main>

<footer class="border-t border-sunk">
	<div class="wrap flex flex-wrap items-center justify-between gap-3 pt-7 pb-10">
		<span class="mono">Yuce — <span lang="tr">yüce</span>, exalted.</span>
		<nav class="flex flex-wrap gap-4 text-sm">
			<a class="link" href="/#policy">Content policy</a>
			<a class="link" href="/#how">Moderation</a>
			<a class="link" href="/privacy">Privacy</a>
		</nav>
	</div>
</footer>
