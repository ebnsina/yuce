<script lang="ts">
	import { requestCode, verifyCode } from './auth.remote';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// The code step opens as soon as one has been sent, and that address carries over.
	const email = $derived(requestCode.result?.email ?? '');
	const sent = $derived(Boolean(requestCode.result?.sent));
</script>

<svelte:head>
	<title>Sign in — Yuce</title>
	<meta name="description" content="Sign in to Yuce with a code sent to your email." />
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="grid max-w-[460px] justify-items-start gap-6 pt-12 pb-20 md:pt-24">
	<span class="chip chip-on">Invite-only beta</span>

	{#if sent}
		<h1 class="big">Check your email.</h1>
		<p class="lead">
			We sent a six-digit code to <strong>{email}</strong>. It works once, for ten minutes.
		</p>

		{#if requestCode.result?.devCode}
			<p class="grid gap-1 rounded-md border border-accent px-4 py-3" role="status">
				<span class="label">Development only</span>
				<span
					>No mail provider is configured, so the code is <b class="num"
						>{requestCode.result.devCode}</b
					>.</span
				>
			</p>
		{/if}

		<form class="grid w-full gap-2.5" {...verifyCode}>
			<input {...verifyCode.fields.email.as('hidden', email)} />
			<input {...verifyCode.fields.next.as('hidden', data.next)} />
			<label class="label" for="code">Your code</label>
			<input
				class="field font-mono text-lg tracking-[0.35em]"
				id="code"
				{...verifyCode.fields.code.as('text')}
				inputmode="numeric"
				autocomplete="one-time-code"
				maxlength="6"
				required
				placeholder="000000"
			/>
			{#each verifyCode.fields.allIssues() ?? [] as issue (issue.message)}
				<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
			{/each}
			<div class="flex flex-wrap gap-2">
				<button class="btn-solid" type="submit" disabled={verifyCode.pending > 0}>
					{verifyCode.pending > 0 ? 'Checking…' : 'Sign in'}
				</button>
			</div>
		</form>

		<form {...requestCode}>
			<input {...requestCode.fields.email.as('hidden', email)} />
			<input {...requestCode.fields.next.as('hidden', data.next)} />
			<button class="btn btn-sm" type="submit" disabled={requestCode.pending > 0}>
				Send a new code
			</button>
		</form>
	{:else}
		<h1 class="big">Sign in.</h1>
		<p class="lead">
			No password to forget and none for us to lose. Give us your email and we will send a code.
		</p>

		<form class="grid w-full gap-2.5" {...requestCode}>
			<input {...requestCode.fields.next.as('hidden', data.next)} />
			<label class="label" for="email">Email address</label>
			<input
				class="field"
				id="email"
				{...requestCode.fields.email.as('email')}
				required
				maxlength="254"
				autocomplete="email"
				placeholder="you@example.com"
			/>
			{#each requestCode.fields.allIssues() ?? [] as issue (issue.message)}
				<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
			{/each}
			<div>
				<button class="btn-solid" type="submit" disabled={requestCode.pending > 0}>
					{requestCode.pending > 0 ? 'Sending…' : 'Send me a code'}
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
