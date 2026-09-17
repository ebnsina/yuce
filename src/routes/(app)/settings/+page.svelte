<script lang="ts">
	import { saveProfile } from '../@[handle]/profile.remote';
	import { deleteAccount } from './account.remote';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Settings — Yuce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="grid max-w-[560px] gap-6">
	<header class="grid justify-items-start gap-2">
		<span class="label">Settings</span>
		<h1 class="title">Your profile</h1>
		<p class="sub">
			Your handle is <span class="mono">@{data.user.handle}</span> and it does not change.
		</p>
	</header>

	<form class="grid gap-3 card" {...saveProfile}>
		<label class="label" for="name">Name</label>
		<input
			class="field"
			id="name"
			{...saveProfile.fields.name.as('text')}
			value={saveProfile.fields.name.value() ?? data.user.name}
			maxlength="60"
			required
		/>

		<label class="label" for="bio">About you</label>
		<textarea
			class="min-h-[80px] field resize-y"
			id="bio"
			{...saveProfile.fields.bio.as('text')}
			maxlength="280"
			placeholder="A line or two. Optional."></textarea>

		{#each saveProfile.fields.allIssues() ?? [] as issue (issue.message)}
			<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
		{/each}

		<div class="flex flex-wrap items-center gap-3">
			<button class="btn-solid" type="submit" disabled={saveProfile.pending > 0}>
				{saveProfile.pending > 0 ? 'Saving…' : 'Save'}
			</button>
			{#if saveProfile.result?.saved}
				<span class="mono" role="status">Saved.</span>
			{/if}
			<a class="link" href="/@{data.user.handle}">View your profile</a>
		</div>
	</form>

	<section class="grid gap-3 card">
		<h2 class="title">Your data</h2>
		<p class="sub">
			Everything we hold about you, in one file you can read without this app: your posts, replies,
			who you follow, who you have blocked, and every report and appeal you made.
		</p>
		<a class="btn justify-self-start btn-sm" href="/settings/export" download>Download it</a>
	</section>

	<section class="grid gap-3 card border border-danger">
		<h2 class="title">Delete your account</h2>
		<p class="sub">
			Your posts, replies, follows and blocks go with it, and deleted means the rows are gone rather
			than hidden. This cannot be undone and nobody can undo it for you.
		</p>
		<form class="grid gap-2" {...deleteAccount}>
			<label class="label" for="confirm">Type @{data.user.handle} to confirm</label>
			<input
				class="field"
				id="confirm"
				{...deleteAccount.fields.handle.as('text')}
				autocomplete="off"
				placeholder={data.user.handle}
			/>
			{#each deleteAccount.fields.allIssues() ?? [] as issue (issue.message)}
				<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
			{/each}
			<button
				class="btn-danger justify-self-start btn-sm"
				type="submit"
				disabled={deleteAccount.pending > 0}
			>
				{deleteAccount.pending > 0 ? 'Deleting…' : 'Delete everything'}
			</button>
		</form>
	</section>
</section>
