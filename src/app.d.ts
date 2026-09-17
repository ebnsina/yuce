declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				handle: string;
				name: string;
				isModerator: boolean;
			} | null;
		}
		interface PageData {
			user?: App.Locals['user'];
		}
	}
}

export {};
