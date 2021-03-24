import { TwitterClient } from "twitter-api-client";
import { ISettings } from "~/models/Settings";

function getTwitterClient(settings: ISettings["twitterApp"]) {
	return new TwitterClient({
		apiKey: settings.consumer_key,
		apiSecret: settings.consumer_secret,
		accessToken: settings.access_token,
		accessTokenSecret: settings.access_token_secret
	});
}

export function getTwitterClientWithCustomSettings(settings: ISettings["twitterApp"]) {
	return getTwitterClient(settings);
}
