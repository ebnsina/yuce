import { EMAIL_FROM, RESEND_API_KEY } from '$app/env/private';

/**
 * No SDK: this is one HTTP call, and a dependency that wraps fetch is a dependency
 * that has to be kept current for nothing.
 */
export async function sendLoginCode(email: string, code: string) {
	if (!RESEND_API_KEY || !EMAIL_FROM) {
		// Dev has no mail provider, so the code goes to the terminal rather than nowhere.
		if (import.meta.env.DEV) {
			console.log(`\n  Login code for ${email}: ${code}\n`);
			return;
		}
		throw new Error('RESEND_API_KEY and EMAIL_FROM must be set to send login codes.');
	}

	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${RESEND_API_KEY}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			from: EMAIL_FROM,
			to: email,
			subject: `${code} is your Yuce code`,
			text: `Your code is ${code}. It works for ten minutes, once.\n\nIf you did not ask to sign in, ignore this — nobody can get in without the code.`
		})
	});

	if (!res.ok) throw new Error(`Resend refused the message: ${res.status} ${await res.text()}`);
}
