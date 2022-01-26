//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { Competition, ICompetitionFormFieldsServerSide } from "~/models/Competition";
import { Game } from "~/models/Game";

//Controller
@controller("/api/competitions")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class CompetitionController {
	/* --------------------------------- */
	/* Utility Methods
	/* --------------------------------- */
	static send404(_id: string, res: Response): void {
		res.status(404).send(`No competition found with the id ${_id}`);
	}

	/* --------------------------------- */
	/* Competition Management
	/* --------------------------------- */

	//Get all competitions
	@get("/")
	@use(requireAuth)
	async getAllCompetitions(req: Request, res: Response) {
		const competitions = await Competition.find({}).lean();
		res.send(_.keyBy(competitions, "_id"));
	}

	//Create new competition
	@use(requireAuth)
	@post("/")
	async createNewCompetition(req: Request, res: Response) {
		const values: ICompetitionFormFieldsServerSide = req.body;
		const competition = new Competition(values);
		await competition.save();
		res.send(competition);
	}

	//Update existing competition
	@use(requireAuth)
	@put("/:_id")
	async updateCompetition(req: Request, res: Response) {
		const { _id } = req.params;
		const values: ICompetitionFormFieldsServerSide = req.body;
		const competition = await Competition.findByIdAndUpdate(_id, values, { new: true });
		if (competition) {
			res.send(competition);
		} else {
			CompetitionController.send404(_id, res);
		}
	}

	//Delete existing competition
	@use(requireAdmin)
	@del("/:_id")
	async deleteCompetition(req: Request, res: Response) {
		const { _id } = req.params;

		//Ensure valid comp
		const competition = await Competition.findById(_id);
		if (!competition) {
			return CompetitionController.send404(_id, res);
		}

		//Ensure no games rely on this competition
		const gamesInThisCompetition = await Game.find({ _competition: _id }, "_id").lean();
		if (gamesInThisCompetition.length) {
			const error = `Cannot delete this competition as ${gamesInThisCompetition.length} ${
				gamesInThisCompetition.length === 1 ? "game depends" : "games depend"
			} on it`;
			const toLog = {
				error
			};
			return res.status(406).send({ error, toLog });
		}

		//Remove
		await competition.remove();
		res.send({});
	}
}
