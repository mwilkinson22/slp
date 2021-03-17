//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Form Fields
import { CompetitionFields } from "~/client/pages/CompetitionPage";

//Models
import { Competition } from "~/models/Competition";

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
		const values: CompetitionFields = req.body;
		const competition = new Competition(values);
		await competition.save();
		res.send(competition);
	}

	//Update existing competition
	@use(requireAuth)
	@put("/:_id")
	async updateCompetition(req: Request, res: Response) {
		const { _id } = req.params;
		const values: CompetitionFields = req.body;
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

		//TODO check it's not required for a game

		//Remove
		await competition.remove();
		res.send({});
	}
}
