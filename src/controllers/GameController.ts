//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { Game, IGame } from "~/models/Game";
import { Team } from "~/models/Team";

//Controller
@controller("/api/games")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class GameController {
	/* --------------------------------- */
	/* Utility Methods
	/* --------------------------------- */
	static send404(_id: string, res: Response): void {
		res.status(404).send(`No game found with the id ${_id}`);
	}

	static async checkHomeTeamGround(game: Partial<IGame>) {
		if (game._ground === "auto") {
			const homeTeam = await Team.findById(game._homeTeam, "_ground").lean();
			game._ground = homeTeam?._ground;
		}

		return game;
	}

	/* --------------------------------- */
	/* Game Management
	/* --------------------------------- */

	//Get all games
	@get("/")
	@use(requireAuth)
	async getAllGames(req: Request, res: Response) {
		const games = await Game.find({}).lean();
		res.send(_.keyBy(games, "_id"));
	}

	//Create new game
	@use(requireAuth)
	@post("/")
	async createNewGame(req: Request, res: Response) {
		const values = await GameController.checkHomeTeamGround(req.body);
		const game = new Game(values);
		await game.save();
		res.send(game);
	}

	//Update existing game
	@use(requireAuth)
	@put("/:_id")
	async updateGame(req: Request, res: Response) {
		const { _id } = req.params;
		const values = await GameController.checkHomeTeamGround(req.body);
		const game = await Game.findByIdAndUpdate(_id, values, { new: true });
		if (game) {
			res.send(game);
		} else {
			GameController.send404(_id, res);
		}
	}

	//Delete existing game
	@use(requireAdmin)
	@del("/single/:_id")
	async deleteGame(req: Request, res: Response) {
		const { _id } = req.params;

		//Ensure valid game
		const game = await Game.findById(_id);
		if (!game) {
			return GameController.send404(_id, res);
		}

		//Remove
		await game.remove();
		res.send({});
	}

	//Delete games over a week old
	@use(requireAdmin)
	@del("/old")
	async deleteOldGames(req: Request, res: Response) {
		//Get current date
		const date = new Date();
		//Subtract one week
		const oneWeekInMs = 7 * 24 * 3600000;
		date.setTime(date.getTime() - oneWeekInMs);

		//Remove
		await Game.remove({ date: { $lt: date } });
		res.send({});
	}
}
