//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { Ground } from "~/models/Ground";

//Controller
@controller("/api/grounds")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class GroundController {
	/* --------------------------------- */
	/* Utility Methods
	/* --------------------------------- */
	static send404(_id: string, res: Response): void {
		res.status(404).send(`No ground found with the id ${_id}`);
	}

	/* --------------------------------- */
	/* Ground Management
	/* --------------------------------- */

	//Get all grounds
	@get("/")
	@use(requireAuth)
	async getAllGrounds(req: Request, res: Response) {
		const grounds = await Ground.find({}).lean();
		res.send(_.keyBy(grounds, "_id"));
	}

	//Create new ground
	@use(requireAuth)
	@post("/")
	async createNewGround(req: Request, res: Response) {
		const ground = new Ground(req.body);
		await ground.save();
		res.send(ground);
	}

	//Update existing ground
	@use(requireAuth)
	@put("/:_id")
	async updateGround(req: Request, res: Response) {
		const { _id } = req.params;
		const ground = await Ground.findByIdAndUpdate(_id, req.body, { new: true });
		if (ground) {
			res.send(ground);
		} else {
			GroundController.send404(_id, res);
		}
	}

	//Delete existing ground
	@use(requireAdmin)
	@del("/:_id")
	async deleteGround(req: Request, res: Response) {
		const { _id } = req.params;

		//Ensure valid ground
		const ground = await Ground.findById(_id);
		if (!ground) {
			return GroundController.send404(_id, res);
		}

		//TODO check it's not required for a game or team

		//Remove
		await ground.remove();
		res.send({});
	}
}
