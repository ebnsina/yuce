<script lang="ts">
	let { children } = $props();
</script>

<header
	class="sticky top-0 z-30 border-b border-sunk bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70"
>
	<div class="wrap flex items-center justify-between gap-4 py-4">
		<a href="/" class="flex items-center gap-2.5">
			<span class="grid h-7 w-7 place-items-center rounded-md bg-brand">
				<span class="h-4 w-4 khatam text-on-brand"></span>
			</span>
			<span class="font-display text-[22px] font-semibold tracking-[-0.04em] text-ink">yuce</span>
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
