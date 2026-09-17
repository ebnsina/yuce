<script lang="ts">
	import {
		addComment,
		createPost,
		deleteComment,
		deletePost,
		getComments,
		getFeed,
		toggleLike
	} from './feed.remote';
	import IconHeart from '~icons/hugeicons/favourite';
	import IconReply from '~icons/hugeicons/bubble-chat';
	import IconFlag from '~icons/hugeicons/flag-02';
	import IconDelete from '~icons/hugeicons/delete-02';
	import IconSend from '~icons/hugeicons/sent';
	import IconImage from '~icons/hugeicons/image-add-02';
	import { reportContent } from './report.remote';
	import { appealRemoval, getMyRemovals } from './removals.remote';
	import { RULES, ruleLabel } from '#lib/rules.js';
	import type { PageData } from './$types';

	// One instance per thing being reported, created once and handed to both snippets:
	// calling `.for(key)` in two places gives two instances, and only one of them ever
	// learns that the report was sent.
	type ReportForm = ReturnType<typeof reportContent.for>;

	let { data }: { data: PageData } = $props();

	// One thread open at a time, and its replies are only fetched once it is.
	let openPost = $state<string | null>(null);
	// The report form opens under the one thing being reported, never as a modal.
	let reporting = $state<string | null>(null);
	// Following is the feed the product promises; everyone is how you find a first
	// person to follow, which a following-only feed cannot do on its own.
	let scope = $state<'following' | 'everyone'>('following');
	// What is attached, named, so nobody posts a photograph they cannot see.
	const chosen = $derived(
		(createPost.fields.images.value() ?? [])
			.filter((f): f is File => f instanceof File && f.size > 0)
			.map((f) => f.name)
	);

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

{#snippet reportAction(kind: 'post' | 'comment', id: string, sent: ReportForm)}
	{@const key = `${kind}:${id}`}
	{#if sent.result?.reported}
		<span class="act text-accent" role="status">
			<IconFlag class="size-4" />
			<span class="text-[12px]">Reported</span>
		</span>
	{:else}
		<button
			class="act"
			aria-label="Report this {kind}"
			aria-expanded={reporting === key}
			onclick={() => (reporting = reporting === key ? null : key)}
		>
			<IconFlag class="size-4" />
		</button>
	{/if}
{/snippet}

{#snippet reportForm(kind: 'post' | 'comment', id: string, sent: ReportForm)}
	{@const key = `${kind}:${id}`}
	{#if !sent.result?.reported}
		<form
			class="grid gap-2 border-t border-sunk pt-3"
			{...sent.enhance(async ({ submit }) => {
				await submit();
				// Closed by the thing that knows it succeeded, rather than by a second
				// render noticing the result a moment later.
				if (sent.result?.reported) reporting = null;
			})}
		>
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
	{/if}
{/snippet}

{#snippet byline(name: string, handle: string, at: Date)}
	<header class="flex flex-wrap items-baseline gap-2">
		<a class="title" href="/@{handle}">{name}</a>
		<a class="mono" href="/@{handle}">@{handle}</a>
		<time class="mono" datetime={at.toISOString()} title={exact.format(at)}>{ago(at)}</time>
	</header>
{/snippet}

<section class="grid gap-6">
	<h1 class="title">Home</h1>

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

	<!-- multipart because of the image field: without it the enhanced and the native
	     submit disagree about what a file is. -->
	<form class="grid gap-3 card" enctype="multipart/form-data" {...createPost}>
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
		<div class="flex flex-wrap items-center gap-2">
			<label class="act cursor-pointer">
				<IconImage class="size-4" />
				<span>Add images</span>
				<input class="vh" {...createPost.fields.images.as('file multiple')} accept="image/*" />
			</label>
			{#if chosen.length}
				<span class="mono">{chosen.length} of 4 attached: {chosen.join(', ')}</span>
			{/if}
		</div>

		<div class="flex items-center justify-between gap-3">
			<span class="mono">{1000 - (createPost.fields.body.value()?.length ?? 0)} left</span>
			<button class="btn-solid" type="submit" disabled={createPost.pending > 0}>
				<IconSend class="size-4" />
				{createPost.pending > 0 ? 'Posting…' : 'Post'}
			</button>
		</div>
	</form>

	<div class="flex flex-wrap gap-2" role="group" aria-label="Which feed">
		<button
			class={scope === 'following' ? 'chip chip-on' : 'chip'}
			aria-pressed={scope === 'following'}
			onclick={() => (scope = 'following')}
		>
			Following
		</button>
		<button
			class={scope === 'everyone' ? 'chip chip-on' : 'chip'}
			aria-pressed={scope === 'everyone'}
			onclick={() => (scope = 'everyone')}
		>
			Everyone
		</button>
	</div>

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

		{#each await getFeed(scope) as item (item.id)}
			{@const open = openPost === item.id}
			{@const flagPost = reportContent.for(`post:${item.id}`)}
			{@const replyForm = addComment.for(item.id)}
			<article class="grid gap-2 card">
				{@render byline(item.authorName, item.authorHandle, item.createdAt)}
				{#if item.images.length && item.body !== null}
					<div class="grid gap-2 {item.images.length > 1 ? 'sm:grid-cols-2' : ''}">
						{#each item.images as image (image.key)}
							{#if image.sensitive}
								<details class="group">
									<summary class="veil relative h-48 cursor-pointer list-none overflow-hidden">
										<img
											class="h-48 w-full rounded-md object-cover blur-xl group-open:blur-none"
											src="/media/{image.key}"
											alt={image.alt ?? ''}
											loading="lazy"
										/>
										<span class="veil__note bottom-3 left-1/2 -translate-x-1/2">
											<span class="group-open:hidden">Blurred · tap to see it</span>
											<span class="hidden group-open:inline">Hide it again</span>
										</span>
									</summary>
								</details>
							{:else}
								<img
									class="h-48 w-full rounded-md object-cover"
									src="/media/{image.key}"
									alt={image.alt ?? ''}
									loading="lazy"
								/>
							{/if}
						{/each}
					</div>
				{/if}

				{#if item.body === null}
					<p class="sub">
						Removed by a moderator — {ruleLabel(item.removedReason ?? 'other')}. The post stays in
						place so the thread still makes sense; its words do not.
					</p>
				{:else}
					<p class="whitespace-pre-wrap">{item.body}</p>
				{/if}

				<div class="flex flex-wrap items-center gap-1 pt-1">
					<button
						class="act"
						aria-pressed={item.liked}
						aria-label={item.liked ? 'Undo your like' : 'Like this'}
						onclick={() =>
							toggleLike(item.id).updates(
								getFeed(scope).withOverride((list) =>
									list.map((p) =>
										p.id === item.id
											? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }
											: p
									)
								)
							)}
					>
						<IconHeart class="size-4 {item.liked ? 'text-accent' : ''}" />
						{#if item.likes > 0}<span class="num text-[12px]">{count.format(item.likes)}</span>{/if}
					</button>

					<button
						class="act"
						aria-label="Replies"
						aria-expanded={open}
						title={open ? 'Hide replies' : replies(item.replies)}
						onclick={() => (openPost = open ? null : item.id)}
					>
						<IconReply class="size-4" />
						{#if item.replies > 0}<span class="num text-[12px]">{count.format(item.replies)}</span
							>{/if}
					</button>

					{#if item.authorId !== data.user.id && item.body !== null}
						{@render reportAction('post', item.id, flagPost)}
					{/if}

					{#if item.authorId === data.user.id}
						{@const remove = deletePost.for(item.id)}
						<form {...remove}>
							<input {...remove.fields.id.as('hidden', item.id)} />
							<button class="act" type="submit" aria-label="Delete this post">
								<IconDelete class="size-4" />
							</button>
						</form>
					{/if}
				</div>

				{#if reporting === `post:${item.id}`}
					{@render reportForm('post', item.id, flagPost)}
				{/if}

				{#if open}
					<div class="mt-1 grid gap-3 border-t border-sunk pt-3">
						<svelte:boundary>
							{#snippet pending()}
								<div class="sk h-4 w-40" aria-label="Loading replies"></div>
							{/snippet}

							{#each await getComments(item.id) as reply (reply.id)}
								{@const flagReply = reportContent.for(`comment:${reply.id}`)}
								<div class="grid gap-1">
									{@render byline(reply.authorName, reply.authorHandle, reply.createdAt)}
									{#if reply.body === null}
										<p class="sub">
											Removed by a moderator — {ruleLabel(reply.removedReason ?? 'other')}.
										</p>
									{:else}
										<p class="whitespace-pre-wrap">{reply.body}</p>
									{/if}
									<div class="flex flex-wrap items-center gap-1">
										{#if reply.authorId !== data.user.id && reply.body !== null}
											{@render reportAction('comment', reply.id, flagReply)}
										{/if}
										{#if reply.authorId === data.user.id}
											{@const removeReply = deleteComment.for(reply.id)}
											<form {...removeReply}>
												<input {...removeReply.fields.id.as('hidden', reply.id)} />
												<button class="act" type="submit" aria-label="Delete this reply">
													<IconDelete class="size-4" />
												</button>
											</form>
										{/if}
									</div>
									{#if reporting === `comment:${reply.id}`}
										{@render reportForm('comment', reply.id, flagReply)}
									{/if}
								</div>
							{/each}
						</svelte:boundary>

						<form class="grid gap-2" {...replyForm}>
							<input {...replyForm.fields.postId.as('hidden', item.id)} />
							<label class="vh" for="reply-{item.id}">Your reply</label>
							<textarea
								class="min-h-[64px] field resize-y"
								id="reply-{item.id}"
								{...replyForm.fields.body.as('text')}
								maxlength="500"
								placeholder="Reply to {item.authorName}"></textarea>
							{#each replyForm.fields.allIssues() ?? [] as issue (issue.message)}
								<p class="text-sm font-semibold text-danger" role="alert">{issue.message}</p>
							{/each}
							<button
								class="btn-solid justify-self-start btn-sm"
								type="submit"
								disabled={replyForm.pending > 0}
							>
								{replyForm.pending > 0 ? 'Sending…' : 'Send reply'}
							</button>
						</form>
					</div>
				{/if}
			</article>
		{:else}
			<p class="sub">
				{#if scope === 'following'}
					Nothing from the people you follow. Try <button
						class="link"
						onclick={() => (scope = 'everyone')}>everyone</button
					> and find somebody worth following.
				{:else}
					Nothing here yet. Whatever you write first sets the tone for everyone who arrives after
					you.
				{/if}
			</p>
		{/each}
	</svelte:boundary>
</section>
