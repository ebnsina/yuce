/**
 * The published policy, as data. The report form, the moderation queue and the notice
 * shown on removed content all read from this list, so the page can never drift from
 * the rule that was actually applied.
 */
export const RULES = [
	{ id: 'gheebah', label: 'Backbiting or slander', hint: 'Speaking ill of a named person.' },
	{ id: 'nudity', label: 'Nudity or sexual content', hint: 'Including jokes and innuendo.' },
	{ id: 'sect', label: 'Takfir or sect-bashing', hint: 'Declaring other Muslims outside Islam.' },
	{ id: 'haram', label: 'Alcohol, pork, gambling or drugs', hint: 'Promoting or selling.' },
	{ id: 'riba', label: 'Riba', hint: 'Interest-based lending or credit promotion.' },
	{ id: 'dating', label: 'Dating or flirtation', hint: 'Courting in public.' },
	{
		id: 'unsourced',
		label: 'Fabricated or unsourced religious claim',
		hint: 'Hadith with no reference.'
	},
	{ id: 'spam', label: 'Spam or a scam', hint: 'Bulk posting, fraud, phishing.' },
	{ id: 'other', label: 'Something else', hint: 'Tell us in your own words.' }
] as const;

export type RuleId = (typeof RULES)[number]['id'];

export const ruleLabel = (id: string) => RULES.find((r) => r.id === id)?.label ?? id;
