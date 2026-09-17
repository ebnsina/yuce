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
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// One thread open at a time, and its replies are only fetched once it is.
	let openPost = $state<string | null>(null);

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
				<p class="whitespace-pre-wrap">{item.body}</p>

				<div class="flex flex-wrap items-center gap-2">
					{#if item.authorId === data.user.id}
						{@const remove = deletePost.for(item.id)}
						<form {...remove}>
							<input {...remove.fields.id.as('hidden', item.id)} />
							<button class="btn btn-sm" type="submit">Delete</button>
						</form>
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
									<p class="whitespace-pre-wrap">{reply.body}</p>
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
