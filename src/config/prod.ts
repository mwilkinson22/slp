declare global {
	interface ProcessEnv {
		API_URL: string;
		AUTH_GUID: string;
		ENABLE_SCHEDULED_TASKS: string;
		MONGO_URI: string;
		COOKIE_KEY: string;
		GITHUB_AUTH_TOKEN: string;
		GOOGLE_BUCKET_NAME: string;
		GOOGLE_CLOUD_EMAIL: string;
		GOGLE_CLOUD_KEY: string;
		NODE_ENV: "development" | "production";
		PORT?: string;
		PWD: string;
	}
}

export default {
	apiUrl: process.env.API_URL,
	authGuid: process.env.AUTH_GUID,
	cookieKey: process.env.COOKIE_KEY,
	enableScheduledTasks: process.env.ENABLE_SCHEDULED_TASKS === "true",
	googleBucketName: process.env.GOOGLE_BUCKET_NAME,
	googleCloudAccount: {
		client_email: process.env.GOOGLE_CLOUD_EMAIL,
		private_key: process.env.GOGLE_CLOUD_KEY
	},
	mongoURI: process.env.MONGO_URI
};
