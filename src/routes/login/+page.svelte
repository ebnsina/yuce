<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let sending = $state(false);

	const step = $derived(form?.step ?? 'email');
	const email = $derived(form?.email ?? '');
	const next = $derived(form?.next ?? data.next);
</script>

<svelte:head>
	<title>Sign in — Yuce</title>
	<meta name="description" content="Sign in to Yuce with a code sent to your email." />
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="grid max-w-[460px] justify-items-start gap-6 pt-12 pb-20 md:pt-24">
	<span class="chip chip-on">Invite-only beta</span>

	{#if step === 'code'}
		<h1 class="big">Check your email.</h1>
		<p class="lead">
			We sent a six-digit code to <strong>{email}</strong>. It works once, for ten minutes.
		</p>

		<form
			class="grid w-full gap-2.5"
			method="POST"
			action="?/verify"
			use:enhance={() => {
				sending = true;
				return async ({ update }) => {
					await update();
					sending = false;
				};
			}}
		>
			<input type="hidden" name="email" value={email} />
			<input type="hidden" name="next" value={next} />
			<label class="label" for="code">Your code</label>
			<input
				class="field font-mono text-lg tracking-[0.35em]"
				id="code"
				name="code"
				inputmode="numeric"
				autocomplete="one-time-code"
				pattern="[0-9]&#123;6&#125;"
				maxlength="6"
				required
				placeholder="000000"
				aria-invalid={form?.error ? 'true' : undefined}
			/>
			{#if form?.error}
				<p class="text-sm font-semibold text-danger" role="alert">{form.error}</p>
			{/if}
			<div class="flex flex-wrap gap-2">
				<button class="btn-solid" type="submit" disabled={sending}>
					{sending ? 'Checking…' : 'Sign in'}
				</button>
				<button class="btn" type="submit" formaction="?/send" disabled={sending}>
					Send a new code
				</button>
			</div>
		</form>
	{:else}
		<h1 class="big">Sign in.</h1>
		<p class="lead">
			No password to forget and none for us to lose. Give us your email and we will send a code.
		</p>

		<form
			class="grid w-full gap-2.5"
			method="POST"
			action="?/send"
			use:enhance={() => {
				sending = true;
				return async ({ update }) => {
					await update();
					sending = false;
				};
			}}
		>
			<input type="hidden" name="next" value={next} />
			<label class="label" for="email">Email address</label>
			<input
				class="field"
				id="email"
				name="email"
				type="email"
				required
				maxlength="254"
				autocomplete="email"
				placeholder="you@example.com"
				value={email}
				aria-invalid={form?.error ? 'true' : undefined}
			/>
			{#if form?.error}
				<p class="text-sm font-semibold text-danger" role="alert">{form.error}</p>
			{/if}
			<div>
				<button class="btn-solid" type="submit" disabled={sending}>
					{sending ? 'Sending…' : 'Send me a code'}
				</button>
			</div>
			<p class="mono">
				Beta is invite-only. If you have not been invited yet, <a class="link" href="/#invite"
					>ask for one</a
				>.
			</p>
		</form>
	{/if}
</section>
