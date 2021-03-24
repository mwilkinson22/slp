//Modules
import { Request, Response } from "express";

//Decorators
import { controller, use, post } from "./decorators";

//Middleware
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { ISettings } from "~/models/Settings";

//Services
import { getTwitterClientWithCustomSettings } from "~/services/twitter";

//Controller
@controller("/api/social")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SocialController {
	@post("/twitter/test-app")
	@use(requireAdmin)
	async testTwitterAppSettings(req: Request, res: Response) {
		const values: ISettings["twitterApp"] = req.body;
		const client = await getTwitterClientWithCustomSettings(values);

		let result, error;
		try {
			result = await client.accountsAndUsers.accountVerifyCredentials();
		} catch (e) {
			error = e.toString();
		}
		if (result) {
			res.send({ authenticated: true, user: result.screen_name });
		} else {
			res.send({ authenticated: false, error });
		}
	}
}
