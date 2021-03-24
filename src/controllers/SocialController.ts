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
import { SocialProfile, ISocialProfileFormFields } from "~/models/SocialProfile";

//Services
import { getTwitterClientWithCustomSettings } from "~/services/twitter";
import { getSettings } from "~/controllers/SettingsController";
import { getCacheInstance } from "~/services/cacheProvider";

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
	//Get all social profiles
	@get("/profiles")
	@use(requireAuth)
	async getAllSocialProfiles(req: Request, res: Response) {
		const socialProfiles = await SocialProfile.find({}).lean();
		res.send(_.keyBy(socialProfiles, "_id"));
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
	@use(requireAuth)
	@put("/profiles/:_id")
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

	//Delete existing socialProfile
	@use(requireAdmin)
	@del("/profiles/:_id")
	async deleteSocialProfile(req: Request, res: Response) {
		const { _id } = req.params;

		//Ensure valid profile
		//TODO Ensure it's not the default
		const profile = await SocialProfile.findById(_id);
		if (!profile) {
			return SocialController.sendProfile404(_id, res);
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
