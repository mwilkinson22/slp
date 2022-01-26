//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { Team, ITeamFormFields, ITeam } from "~/models/Team";

//Canvases
import { TeamBanner } from "~/canvas/TeamBanner";
import { ISettings } from "~/models/Settings";
import { Game } from "~/models/Game";

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
	@get("/all")
	@use(requireAuth)
	async getAllTeams(req: Request, res: Response) {
		const teams = await Team.find({}).lean();
		res.send(_.keyBy(teams, "_id"));
	}

	//Create new team
	@use(requireAuth)
	@post("/")
	async createNewTeam(req: Request, res: Response) {
		const values: ITeamFormFields = req.body;
		const team = new Team(values);
		await team.save();
		res.send(team);
	}

	//Update existing team
	@use(requireAuth)
	@put("/:_id")
	async updateTeam(req: Request, res: Response) {
		const { _id } = req.params;
		const values: ITeamFormFields = req.body;
		const team = await Team.findByIdAndUpdate(_id, values, { new: true });
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

		//Ensure no games rely on this team
		const gamesWithThisTeam = await Game.find({ $or: [{ _homeTeam: _id }, { _awayTeam: _id }] }, "_id").lean();
		if (gamesWithThisTeam.length) {
			const error = `Cannot delete this team as ${gamesWithThisTeam.length} ${
				gamesWithThisTeam.length === 1 ? "game depends" : "games depend"
			} on it`;
			const toLog = {
				error
			};
			return res.status(406).send({ error, toLog });
		}

		//Remove
		await team.remove();
		res.send({});
	}

	//Get Team Banner Preview
	@use(requireAuth)
	@post("/bannerPreview")
	async getBannerPreview(req: Request, res: Response) {
		const values: ITeam = req.body.team;
		const format: ISettings["singleGamePost"]["teamName"] = req.body.nameFormat;

		//Create Image and return
		const image = new TeamBanner(values, format, true, 600, 95);
		const result = await image.renderToBase64();
		res.send(result);
	}
}
