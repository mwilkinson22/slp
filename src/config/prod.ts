declare global {
	interface ProcessEnv {
		API_URL: string;
		AUTH_GUID: string;
		ENABLE_SCHEDULED_TASKS: string;
		MONGO_URI: string;
		COOKIE_KEY: string;
		GITHUB_AUTH_TOKEN: string;
		NODE_ENV: "development" | "production";
		PORT?: string;
		PWD: string;
	}
}

export default {
	apiUrl: process.env.API_URL,
	authGuid: process.env.AUTH_GUID,
	enableScheduledTasks: process.env.ENABLE_SCHEDULED_TASKS === "true",
	mongoURI: process.env.MONGO_URI,
	cookieKey: process.env.COOKIE_KEY,
	contactEmail: process.env.CONTACT_EMAIL
};
