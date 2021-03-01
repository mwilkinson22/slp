//Interfaces
import { Request, Response, NextFunction } from "express";

//Constants
import { keys } from "~/config/keys";
import { IUser } from "~/models/User";
const { authGuid } = keys;

//Middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
	if (req.query.authGuid !== authGuid && !(req.user as IUser)?.isAdmin) {
		return res.status(401).send({
			error: "You must be logged in as an admin to perform this action"
		});
	}

	next();
}
