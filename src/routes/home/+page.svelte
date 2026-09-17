<script lang="ts">
	import { signOut } from '../login/auth.remote';
	import {
		addComment,
		createPost,
		deleteComment,
		deletePost,
		getComments,
		getFeed
	} from './feed.remote';
	import { reportContent } from './report.remote';
	import { appealRemoval, getMyRemovals } from './removals.remote';
	import { RULES, ruleLabel } from '#lib/rules.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// One thread open at a time, and its replies are only fetched once it is.
	let openPost = $state<string | null>(null);
	// The report form opens under the one thing being reported, never as a modal.
	let reporting = $state<string | null>(null);

	const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	const exact = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
	const count = new Intl.NumberFormat('en');
	const plural = new Intl.PluralRules('en');
	const replies = (n: number) =>
		`${count.format(n)} ${plural.select(n) === 'one' ? 'reply' : 'replies'}`;

	const units = [
		['year', 31_536_000],
		['month', 2_592_000],
		['week', 604_800],
		['day', 86_400],
		['hour', 3600],
		['minute', 60]
	] as const;

	function ago(date: Date) {
		const seconds = (Date.now() - date.getTime()) / 1000;
		for (const [unit, size] of units) {
			if (seconds >= size) return relative.format(-Math.floor(seconds / size), unit);
		}
		return 'just now';
	}
</script>

<svelte:head>
	<title>Home — Yuce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#snippet reportBox(kind: 'post' | 'comment', id: string)}
	{@const key = `${kind}:${id}`}
	{@const sent = reportContent.for(key)}
	{#if sent.result?.reported}
		<p class="mono" role="status">
			Reported. A moderator reads it, and you are told what happened.
		</p>
	{:else if reporting === key}
		<form class="grid gap-2 border-t border-sunk pt-3" {...sent}>
			<input {...sent.fields.kind.as('hidden', kind)} />
			<input {...sent.fields.id.as('hidden', id)} />
			<label class="label" for="rule-{key}">Which rule does this break?</label>
			<select class="select" id="rule-{key}" {...sent.fields.rule.as('select')}>
				{#each RULES as rule (rule.id)}
					<option value={rule.id}>{rule.label} — {rule.hint}</option>
				{/each}
			</select>
			<label class="vh" for="note-{key}">Anything else we should know</label>
			<textarea
				class="min-h-[56px] field resize-y"
				id="note-{key}"
				{...sent.fields.note.as('text')}
				maxlength="500"
				placeholder="Anything else we should know (optional)"></textarea>
			{#each sent.fields.allIssues() ?? [] as issue (issue.message)}
				<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
			{/each}
			<div class="flex flex-wrap gap-2">
				<button class="btn-solid btn-sm" type="submit" disabled={sent.pending > 0}>
					{sent.pending > 0 ? 'Sending…' : 'Send report'}
				</button>
				<button class="btn btn-sm" type="button" onclick={() => (reporting = null)}>Cancel</button>
			</div>
		</form>
	{:else}
		<button class="btn justify-self-start btn-sm" onclick={() => (reporting = key)}>Report</button>
	{/if}
{/snippet}

{#snippet byline(name: string, handle: string, at: Date)}
	<header class="flex flex-wrap items-baseline gap-2">
		<span class="title">{name}</span>
		<span class="mono">@{handle}</span>
		<time class="mono" datetime={at.toISOString()} title={exact.format(at)}>{ago(at)}</time>
	</header>
{/snippet}

<section class="grid max-w-[620px] gap-6 py-10">
	<header class="flex flex-wrap items-center justify-between gap-3">
		<div class="grid gap-0.5">
			<h1 class="title">Assalamu alaikum, {data.user.name}</h1>
			<span class="mono">@{data.user.handle}</span>
		</div>
		<button class="btn btn-sm" onclick={() => signOut()} disabled={signOut.pending > 0}>
			Sign out
		</button>
	</header>

	<svelte:boundary>
		{#snippet pending()}
			<span class="vh">Checking for notices</span>
		{/snippet}
		{#each await getMyRemovals() as gone (gone.reportId)}
			{@const appealForm = appealRemoval.for(gone.reportId)}
			{@const hoursLeft = 48 - (Date.now() - (gone.decidedAt?.getTime() ?? 0)) / 3_600_000}
			<article class="grid gap-2 card border border-danger">
				<span class="label">Removed by a moderator</span>
				<h2 class="title">Your {gone.kind} was taken down — {ruleLabel(gone.rule)}</h2>
				{#if gone.appealState === 'open'}
					<p class="sub">Your appeal is with a moderator. A person reads it within 48 hours.</p>
				{:else if gone.appealState === 'upheld'}
					<p class="sub">Appealed and upheld. The removal stands, and that is the end of it.</p>
				{:else if hoursLeft <= 0}
					<p class="sub">The 48 hours for appealing have passed.</p>
				{:else}
					<form class="grid gap-2" {...appealForm}>
						<input {...appealForm.fields.reportId.as('hidden', gone.reportId)} />
						<label class="sub" for="appeal-{gone.reportId}">
							If we got this wrong, say why. One level, a human, within 48 hours —
							{Math.ceil(hoursLeft)} left.
						</label>
						<textarea
							class="min-h-[64px] field resize-y"
							id="appeal-{gone.reportId}"
							{...appealForm.fields.note.as('text')}
							maxlength="1000"
							placeholder="Why this should not have come down"></textarea>
						{#each appealForm.fields.allIssues() ?? [] as issue (issue.message)}
							<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
						{/each}
						<button
							class="btn justify-self-start btn-sm"
							type="submit"
							disabled={appealForm.pending > 0}
						>
							{appealForm.pending > 0 ? 'Sending…' : 'Appeal this'}
						</button>
					</form>
				{/if}
			</article>
		{/each}
	</svelte:boundary>

	<form class="grid gap-3 card" {...createPost}>
		<label class="vh" for="body">What are you writing?</label>
		<textarea
			class="min-h-[96px] field resize-y"
			id="body"
			{...createPost.fields.body.as('text')}
			maxlength="1000"
			placeholder="Say something worth someone's time."></textarea>
		{#each createPost.fields.allIssues() ?? [] as issue (issue.message)}
			<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
		{/each}
		<div class="flex items-center justify-between gap-3">
			<span class="mono">{1000 - (createPost.fields.body.value()?.length ?? 0)} left</span>
			<button class="btn-solid" type="submit" disabled={createPost.pending > 0}>
				{createPost.pending > 0 ? 'Posting…' : 'Post'}
			</button>
		</div>
	</form>

	<svelte:boundary>
		{#snippet pending()}
			<div class="grid gap-3" aria-label="Loading the feed">
				{#each [1, 2, 3] as n (n)}
					<div class="grid gap-2 card">
						<div class="sk h-4 w-32"></div>
						<div class="sk h-4 w-full"></div>
						<div class="sk h-4 w-2/3"></div>
					</div>
				{/each}
			</div>
		{/snippet}

		{#each await getFeed() as item (item.id)}
			{@const open = openPost === item.id}
			<article class="grid gap-2 card">
				{@render byline(item.authorName, item.authorHandle, item.createdAt)}
				{#if item.body === null}
					<p class="sub">
						Removed by a moderator — {ruleLabel(item.removedReason ?? 'other')}. The post stays in
						place so the thread still makes sense; its words do not.
					</p>
				{:else}
					<p class="whitespace-pre-wrap">{item.body}</p>
				{/if}

				<div class="flex flex-wrap items-center gap-2">
					{#if item.authorId === data.user.id}
						{@const remove = deletePost.for(item.id)}
						<form {...remove}>
							<input {...remove.fields.id.as('hidden', item.id)} />
							<button class="btn btn-sm" type="submit">Delete</button>
						</form>
					{/if}
					{#if item.authorId !== data.user.id && item.body !== null}
						{@render reportBox('post', item.id)}
					{/if}
					<button
						class="btn btn-sm"
						aria-expanded={open}
						onclick={() => (openPost = open ? null : item.id)}
					>
						{open ? 'Hide replies' : item.replies > 0 ? replies(item.replies) : 'Reply'}
					</button>
				</div>

				{#if open}
					{@const reply = addComment.for(item.id)}
					<div class="mt-1 grid gap-3 border-t border-sunk pt-3">
						<svelte:boundary>
							{#snippet pending()}
								<div class="sk h-4 w-40" aria-label="Loading replies"></div>
							{/snippet}

							{#each await getComments(item.id) as reply (reply.id)}
								<div class="grid gap-1">
									{@render byline(reply.authorName, reply.authorHandle, reply.createdAt)}
									{#if reply.body === null}
										<p class="sub">
											Removed by a moderator — {ruleLabel(reply.removedReason ?? 'other')}.
										</p>
									{:else}
										<p class="whitespace-pre-wrap">{reply.body}</p>
									{/if}
									{#if reply.authorId !== data.user.id && reply.body !== null}
										{@render reportBox('comment', reply.id)}
									{/if}
									{#if reply.authorId === data.user.id}
										{@const removeReply = deleteComment.for(reply.id)}
										<form class="justify-self-start" {...removeReply}>
											<input {...removeReply.fields.id.as('hidden', reply.id)} />
											<button class="btn btn-sm" type="submit">Delete reply</button>
										</form>
									{/if}
								</div>
							{/each}
						</svelte:boundary>

						<form class="grid gap-2" {...reply}>
							<input {...reply.fields.postId.as('hidden', item.id)} />
							<label class="vh" for="reply-{item.id}">Your reply</label>
							<textarea
								class="min-h-[64px] field resize-y"
								id="reply-{item.id}"
								{...reply.fields.body.as('text')}
								maxlength="500"
								placeholder="Reply to {item.authorName}"></textarea>
							{#each reply.fields.allIssues() ?? [] as issue (issue.message)}
								<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
							{/each}
							<button
								class="btn-solid justify-self-start btn-sm"
								type="submit"
								disabled={reply.pending > 0}
							>
								{reply.pending > 0 ? 'Sending…' : 'Send reply'}
							</button>
						</form>
					</div>
				{/if}
			</article>
		{:else}
			<p class="sub">
				Nothing here yet. Whatever you write first sets the tone for everyone who arrives after you.
			</p>
		{/each}
	</svelte:boundary>
</section>
