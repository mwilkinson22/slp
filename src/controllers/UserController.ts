//Modules
import _ from "lodash";
import { Request, Response } from "express";
import passport from "passport";

//Decorators
import { get, post, controller, use, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Helpers
import { getUsernameErrors, getPasswordErrors } from "~/helpers/userHelper";

//Models
import { IUser, User } from "~/models/User";

//Controller
@controller("/api")
class UserController {
	/* --------------------------------- */
	/* Utility Methods
	/* --------------------------------- */
	static getCurrentUser(req: Request, res: Response): void {
		res.send(req.user);
	}

	static send404(_id: string, res: Response): void {
		res.status(404).send(`No user found with the id ${_id}`);
	}

	/* --------------------------------- */
	/* Authentication
	/* --------------------------------- */
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

	/* --------------------------------- */
	/* User Management
	/* --------------------------------- */
	//Get all existing users
	@get("/users")
	@use(requireAdmin)
	async getAllUsers(req: Request, res: Response) {
		const users = await User.find({}).lean();
		res.send(_.keyBy(users, "_id"));
	}

	//Create New User
	@post("/user")
	@use(requireAdmin)
	async createNewUser(req: Request, res: Response) {
		//Check for valid username
		const usernameError = getUsernameErrors(req.body.username);
		if (usernameError) {
			return res.status(400).send(usernameError);
		}

		//Valid password
		const passwordError = getPasswordErrors(req.body.password);
		if (passwordError) {
			return res.status(400).send(passwordError);
		}

		//Unique Username
		const existingUser = await User.findOne({ username: req.body.username }, "_id").lean();
		if (existingUser) {
			return res.status(400).send("Username already belongs to another user");
		}

		//Create a new user
		const user = new User(req.body);
		user.password = user.generateHash(req.body.password);
		await user.save();
		res.send(user);
	}

	//Update existing user
	@put("/user/:_id")
	@use(requireAuth)
	async updateUser(req: Request, res: Response) {
		const { _id } = req.params;
		const authUser = req.user as IUser;

		//Ensure a non-admin user isn't editing someone else
		if (!authUser.isAdmin && _id !== authUser._id.toString()) {
			return res.status(401).send("Only an administrator may perform this action");
		}

		//Ensure we have a user
		const user = await User.findById(_id);
		if (!user) {
			return UserController.send404(_id, res);
		}

		//Get values
		const values = { ...req.body };

		//Ensure we have a valid password, and hash it
		if (req.body.password) {
			const passwordError = getPasswordErrors(values.password);
			if (passwordError) {
				return res.status(400).send(passwordError);
			} else {
				values.password = user.generateHash(values.password);
			}
		}

		//Update user
		const newUser = await User.findByIdAndUpdate(_id, values, { new: true });
		res.send(newUser);
	}

	//Delete existing user
	@del("/user/:_id")
	@use(requireAdmin)
	async deleteUser(req: Request, res: Response) {
		const { _id } = req.params;

		//Ensure we have a valid user
		const user = await User.findById({ _id }, "_id isAdmin");
		if (!user) {
			return UserController.send404(_id, res);
		}

		//Check they're not an admin user
		if (user.isAdmin) {
			return res.status(401).send(`Cannot delete admin users`);
		}

		//Otherwise, remove
		await user.remove();
		res.send({});
	}
}
