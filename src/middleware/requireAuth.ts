//Interfaces
import { Request, Response, NextFunction } from "express";

//Constants
import { keys } from "~/config/keys";
const { authGuid } = keys;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
	if (req.query.authGuid !== authGuid && !req.user) {
		return res.status(401).send({ error: "You must log in to perform this action" });
	}

	next();
};
