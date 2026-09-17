<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Home — Yuce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="grid justify-items-start gap-6 pt-12 pb-20 md:pt-20">
	<span class="label">Signed in</span>
	<h1 class="big">Assalamu alaikum, {data.user.name}.</h1>
	<p class="lead measure">
		Your account exists: <span class="mono">@{data.user.handle}</span>. The feed is next — nothing
		to read here yet, and nothing pretending there is.
	</p>
	<form method="POST" action="/logout">
		<button class="btn" type="submit">Sign out</button>
	</form>
</section>
