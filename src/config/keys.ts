/* eslint-disable @typescript-eslint/no-var-requires */

export interface IConfigKeys {
	apiUrl: string;
	authGuid: string;
	contactEmail: string;
	cookieKey: string;
	enableScheduledTasks: boolean;
	IFTTT: string;
	mapsKey: string;
	mongoURI: string;
}

let keys: IConfigKeys;
if (process.env.NODE_ENV === "production") {
	keys = require("./prod").default;
} else {
	keys = require("./dev").default;
}

export { keys };
