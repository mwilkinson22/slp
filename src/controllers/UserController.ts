//Modules
import { Request, Response } from "express";
import passport from "passport";

//Decorators
import { get, post, controller, use } from "./decorators";

//Middleware
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { User } from "~/models/User";

//Controller
@controller("/api")
class UserController {
	//To be called by other methods
	static getCurrentUser(req: Request, res: Response) {
		res.send(req.user);
	}

	//Create New User
	@post("/user")
	@use(requireAdmin)
	async createNewUser(req: Request, res: Response) {
		const user = new User(req.body);
		user.password = user.generateHash(req.body.password);

		await user.save();
		res.send(user);
	}

	//Get User
	@get("/user/:_id")
	@use(requireAdmin)
	async getUser(req: Request, res: Response) {
		const { id } = req.params;
		const user = await User.findById(id);
		if (user) {
			res.send(user);
		} else {
			res.status(404).send(`User '${id}' does not exist`);
		}
	}

	//Get Current User
	@get("/current_user")
	async getCurrentUser(req: Request, res: Response) {
		await UserController.getCurrentUser(req, res);
	}

	//Log In
	@post("/login")
	@use(passport.authenticate("local"))
	async login(req: Request, res: Response) {
		//If the passport middleware hasn't failed, we've successfully logged in
		await UserController.getCurrentUser(req, res);
	}

	//Log Out
	@get("/logout")
	async logout(req: Request, res: Response) {
		req.logout();
		res.send({});
	}
}
