import { TwitterClient } from "twitter-api-client";
import { ISettings } from "~/models/Settings";
import { ISocialProfile } from "~/models/SocialProfile";

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

export function getTwitterClientWithProfile(settings: ISettings["twitterApp"], profile: ISocialProfile) {
	const config: ISettings["twitterApp"] = {
		consumer_key: settings.consumer_key,
		consumer_secret: settings.consumer_secret,
		access_token: profile.twitter_access_token,
		access_token_secret: profile.twitter_access_token_secret
	};
	return getTwitterClient(config);
}
