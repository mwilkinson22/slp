//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { Team } from "~/models/Team";

//Controller
@controller("/api/teams")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TeamController {
	/* --------------------------------- */
	/* Utility Methods
	/* --------------------------------- */
	static send404(_id: string, res: Response): void {
		res.status(404).send(`No team found with the id ${_id}`);
	}

	/* --------------------------------- */
	/* Team Management
	/* --------------------------------- */

	//Get all teams
	@get("/")
	@use(requireAuth)
	async getAllTeams(req: Request, res: Response) {
		const teams = await Team.find({}).lean();
		res.send(_.keyBy(teams, "_id"));
	}

	//Create new team
	@use(requireAuth)
	@post("/")
	async createNewTeam(req: Request, res: Response) {
		const team = new Team(req.body);
		await team.save();
		res.send(team);
	}

	//Update existing team
	@use(requireAuth)
	@put("/:_id")
	async updateTeam(req: Request, res: Response) {
		const { _id } = req.params;
		const team = await Team.findByIdAndUpdate(_id, req.body, { new: true });
		if (team) {
			res.send(team);
		} else {
			TeamController.send404(_id, res);
		}
	}

	//Delete existing team
	@use(requireAdmin)
	@del("/:_id")
	async deleteTeam(req: Request, res: Response) {
		const { _id } = req.params;

		//Ensure valid team
		const team = await Team.findById(_id);
		if (!team) {
			return TeamController.send404(_id, res);
		}

		//TODO check it's not required for a game

		//Remove
		await team.remove();
		res.send({});
	}
}