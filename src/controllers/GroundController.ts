//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { Game } from "~/models/Game";
import { Ground, IGroundFormFields } from "~/models/Ground";
import { Team } from "~/models/Team";

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
		const values: IGroundFormFields = req.body;
		const ground = new Ground(values);
		await ground.save();
		res.send(ground);
	}

	//Update existing ground
	@use(requireAuth)
	@put("/:_id")
	async updateGround(req: Request, res: Response) {
		const { _id } = req.params;
		const values: IGroundFormFields = req.body;
		const ground = await Ground.findByIdAndUpdate(_id, values, { new: true });
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

		//Ensure it's not used for any teams
		const teamsBasedAtThisGround = await Team.find({ _ground: _id }, "name").lean();
		if (teamsBasedAtThisGround.length) {
			const error = `Cannot delete this ground as ${teamsBasedAtThisGround.length} ${
				teamsBasedAtThisGround.length === 1 ? "team depends" : "teams depend"
			} on it`;
			const toLog = {
				error,
				teams: teamsBasedAtThisGround.map(t => t.name.long)
			};
			return res.status(406).send({ error, toLog });
		}

		//Ensure it's not used for any teams
		const gamesBasedAtThisGround = await Game.find({ _ground: _id }, "_id").lean();
		if (gamesBasedAtThisGround.length) {
			const error = `Cannot delete this ground as ${gamesBasedAtThisGround.length} ${
				gamesBasedAtThisGround.length === 1 ? "game depends" : "games depend"
			} on it`;
			const toLog = {
				error
			};
			return res.status(406).send({ error, toLog });
		}

		//Remove
		await ground.remove();
		res.send({});
	}
}
