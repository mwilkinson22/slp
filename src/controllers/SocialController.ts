//Modules
import _ from "lodash";
import { OAuth } from "oauth";
import { Request, Response } from "express";

//Decorators
import { controller, use, post, get, put, del } from "./decorators";

//Middleware
import { requireAdmin } from "~/middleware/requireAdmin";
import { requireAuth } from "~/middleware/requireAuth";

//Models
import { ISettings } from "~/models/Settings";
import { SocialProfile, ISocialProfileFormFields, ISocialProfile } from "~/models/SocialProfile";

//Services
import { getTwitterClientWithCustomSettings, getTwitterClientWithProfile } from "~/services/twitter";
import { getSettings } from "~/controllers/SettingsController";
import { getCacheInstance } from "~/services/cacheProvider";
import { IUser } from "~/models/User";
import axios from "axios";

//Generic Poster
export async function postToSocial(
	text: string,
	_profile: string,
	image: string,
	postToFacebook: boolean
): Promise<{ error: string } | { tweetId: string }> {
	//First, validate the profile
	const profile = await SocialProfile.findById(_profile).lean();
	if (!profile) {
		return { error: `Invalid profile ID - ${profile}` };
	}

	//Get the settings we need
	const twitterSettings = await getSettings<"twitterApp">("twitterApp");

	//Get a twitter client
	const twitterClient = getTwitterClientWithProfile(twitterSettings, profile as ISocialProfile);

	//Set a generic error variable we can keep checking
	let error;

	//Then, upload the image (if we have one)
	let media_id;
	try {
		const result = await twitterClient.media.mediaUpload({ media_data: image });
		media_id = result.media_id_string;
	} catch (e) {
		error = JSON.parse(e.data).errors[0].message;
	}
	if (error) {
		return { error };
	}

	//Post Tweet
	let tweetId, media_url;
	try {
		const tweet = await twitterClient.tweets.statusesUpdate({
			status: text,
			media_ids: media_id,
			tweet_mode: "extended"
		});
		tweetId = tweet.id_str;
		//Adding tweet_mode = "extended" gives us access to the media property,
		//but typescript doesn't recognise this, so unfortunately we need to cast it to any
		media_url = (tweet.entities as any).media[0].media_url;
	} catch (e) {
		error = JSON.parse(e.data).errors[0].message;
	}

	//Post to facebook
	if (postToFacebook && profile.ifttt_key && media_url) {
		//Post to facebook
		const data = {
			value1: text.replace(/\n/g, "<br />"),
			value2: media_url
		};

		//Submit
		await axios.post(`https://maker.ifttt.com/trigger/facebook_with_photo/with/key/${profile.ifttt_key}`, data);
	}

	//Return tweet
	if (tweetId) {
		return { tweetId };
	} else if (error) {
		return { error };
	} else {
		return { error: "An unknown error occured" };
	}
}

//Controller
@controller("/api/social")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SocialController {
	/* --------------------------------- */
	/* Utility Methods
	/* --------------------------------- */
	static sendProfile404(_id: string, res: Response): void {
		res.status(404).send(`No social profile found with the id ${_id}`);
	}

	/* --------------------------------- */
	/* Social Profile Management
	/* --------------------------------- */
	static async getAllSocialProfiles(req: Request, res: Response) {
		const query: Record<string, any> = {};

		//Limit non-admins to the default
		if (!(req.user as IUser).isAdmin) {
			query.isDefault = true;
		}

		const socialProfiles = await SocialProfile.find(query).lean();
		res.send(_.keyBy(socialProfiles, "_id"));
	}
	//Get all social profiles
	@get("/profiles")
	@use(requireAuth)
	async getAllSocialProfiles(req: Request, res: Response) {
		await SocialController.getAllSocialProfiles(req, res);
	}

	//Create new social profile
	@use(requireAdmin)
	@post("/profiles")
	async createNewSocialProfile(req: Request, res: Response) {
		const values: ISocialProfileFormFields = req.body;
		const socialProfile = new SocialProfile(values);
		await socialProfile.save();
		res.send(socialProfile);
	}

	//Update existing social profile
	@use(requireAdmin)
	@put("/profiles/id/:_id")
	async updateSocialProfile(req: Request, res: Response) {
		const { _id } = req.params;
		const values: ISocialProfileFormFields = req.body;
		const socialProfile = await SocialProfile.findByIdAndUpdate(_id, values, { new: true });
		if (socialProfile) {
			res.send(socialProfile);
		} else {
			SocialController.sendProfile404(_id, res);
		}
	}

	//Set default social profile
	@use(requireAdmin)
	@put("/profiles/default/:_id")
	async setDefaultSocialProfile(req: Request, res: Response) {
		const { _id } = req.params;
		const socialProfile = await SocialProfile.findByIdAndUpdate(_id, { isDefault: true }, { new: true });
		if (socialProfile) {
			//If we get a profile back, we know we've set a valid one to be the default, and need to update the others
			await SocialProfile.updateMany({ _id: { $ne: _id } }, { isDefault: false }, { multi: true });

			//Return the full list
			await SocialController.getAllSocialProfiles(req, res);
		} else {
			SocialController.sendProfile404(_id, res);
		}
	}

	//Delete existing socialProfile
	@use(requireAdmin)
	@del("/profiles/:_id")
	async deleteSocialProfile(req: Request, res: Response) {
		const { _id } = req.params;

		//Ensure valid profile
		const profile = await SocialProfile.findById(_id);
		if (!profile) {
			return SocialController.sendProfile404(_id, res);
		}

		//Ensure it's not the default
		if (profile.isDefault) {
			return res.status(403).send("Cannot delete default profile");
		}

		await profile.remove();
		res.send({});
	}

	/* --------------------------------- */
	/* OAuth Methods
	/* --------------------------------- */
	static getTwitterOAuthCallback(req: Request) {
		//Twitter API doesn't allow localhost, so we replace it with an IP
		const host = (req.get("host") as string).replace("localhost", "127.0.0.1");
		return `${req.protocol}://${host}/api/social/oauth/twitter/callback`;
	}
	static async getOAuthClient(req: Request) {
		//Get Settings
		const settings = await getSettings<"twitterApp">("twitterApp");

		return new OAuth(
			"https://api.twitter.com/oauth/request_token",
			"https://api.twitter.com/oauth/access_token",
			settings.consumer_key,
			settings.consumer_secret,
			"1.0",
			SocialController.getTwitterOAuthCallback(req),
			"HMAC-SHA1"
		);
	}

	@get("/oauth/twitter/authorise")
	async authoriseTwitter(req: Request, res: Response) {
		//Get client
		const client = await SocialController.getOAuthClient(req);

		//Try to get token
		client.getOAuthRequestToken((error, token) => {
			if (error) {
				res.status(error.statusCode).send(
					`${error.data}<br /><br />Callback URL: ${SocialController.getTwitterOAuthCallback(req)}`
				);
			} else {
				res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${token}`);
			}
		});
	}

	@get("/oauth/twitter/callback")
	async twitterCallback(req: Request, res: Response) {
		const { oauth_token, oauth_verifier } = req.query;

		const client = await SocialController.getOAuthClient(req);

		if (client) {
			client.getOAuthAccessToken(
				oauth_token as string,
				"",
				oauth_verifier as string,
				(err, access_token, access_token_secret) => {
					if (err) {
						console.error(err);
					} else {
						const cache = getCacheInstance();
						cache.set("authorisedTwitter", { access_token, access_token_secret }, 10);
					}

					//Return confirmation
					res.send("<script>window.close()</script>");
				}
			);
		}
	}

	@get("/oauth/twitter/authorisedAccount")
	async getAuthorisedAccounts(req: Request, res: Response) {
		const cache = getCacheInstance();
		const result = cache.get("authorisedTwitter");
		res.send(result);
	}

	/* --------------------------------- */
	/* Twitter Methods
	/* --------------------------------- */
	@post("/twitter/test-app")
	@use(requireAdmin)
	async testTwitterAppSettings(req: Request, res: Response) {
		const values: ISettings["twitterApp"] = req.body;
		const client = await getTwitterClientWithCustomSettings(values);

		let result, error;
		try {
			result = await client.accountsAndUsers.accountVerifyCredentials();
		} catch (e) {
			error = JSON.parse(e.data).errors[0].message;
		}
		if (result) {
			res.send({ authenticated: true, user: result.screen_name });
		} else {
			res.send({ authenticated: false, error });
		}
	}
}
