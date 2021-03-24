//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { ISettings } from "~/models/Settings";
import { Game, IGame, IGameForImagePost, IGameFormFields } from "~/models/Game";
import { ITeam, Team } from "~/models/Team";

//Helpers
import { getSettings } from "~/controllers/SettingsController";

//Canvases
import { SingleGameCanvas } from "~/canvas/SingleGameCanvas";
import { Competition, ICompetition } from "~/models/Competition";
import { parseGameVariablesForPost } from "~/helpers/gameHelper";

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

	static async checkHomeTeamGround(game: IGameFormFields): Promise<IGameFormFields> {
		if (game._ground === "auto") {
			const homeTeam = await Team.findById(game._homeTeam, "_ground").lean();
			game._ground = homeTeam!._ground;
		}

		return game;
	}

	static async createDummyGame(forImage: true): Promise<IGameForImagePost>;
	static async createDummyGame(forImage: false): Promise<IGame>;
	static async createDummyGame(forImage: boolean) {
		//Pull extra data
		const teams: ITeam[] = await Team.aggregate([{ $sample: { size: 2 } }]);
		const competitions: ICompetition[] = await Competition.aggregate([{ $sample: { size: 1 } }]);
		const _homeTeam = forImage ? teams[0] : teams[0]._id;
		const _awayTeam = forImage ? teams[1] : teams[1]._id;
		const _competition = forImage ? competitions[0] : competitions[0]._id;

		//Create basic object
		const game = {
			_id: "1",
			_homeTeam,
			_awayTeam,
			_competition,
			date: "2021-01-01",
			retweeted: false,
			isOnTv: false,
			overwriteHashtag: false,
			postAfterGame: false,
			includeInWeeklyPost: false
		};

		//Add hashtags for image game
		if (forImage) {
			return {
				...game,
				hashtags: ["GrandFinal"]
			};
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

	/* --------------------------------- */
	/* Images
	/* --------------------------------- */
	static async getGameForImagePost(_id: string): Promise<IGameForImagePost | false> {
		//If we've said "any", then we either overwrite _id with that of the next game,
		//or we set it to "dummy"
		if (_id === "any") {
			const randomGame = await Game.findOne({}).sort("date").lean();
			if (randomGame) {
				_id = randomGame._id.toString();
			} else {
				//If we don't have any games, make one up on the fly
				_id = "dummy";
			}
		}

		//Get the game
		let game;
		if (_id === "dummy") {
			game = await GameController.createDummyGame(true);
		} else {
			game = await Game.findById(_id)
				.populate({ path: "_homeTeam" })
				.populate({ path: "_awayTeam" })
				.populate({ path: "_ground" })
				.populate({ path: "_competition" });
		}

		if (game) {
			//Mongoose's Typescript handling doesn't account for population,
			//so while this is nasty, it works
			return (game as any) as IGameForImagePost;
		} else {
			return false;
		}
	}

	static async generateSingleFixtureImage(
		game: IGameForImagePost,
		optionOverride?: Partial<ISettings["singleGamePost"]>
	) {
		//Process options
		const settingsFromDb = await getSettings("singleGamePost");
		const options: ISettings["singleGamePost"] = {
			...settingsFromDb,
			...optionOverride
		};
		return new SingleGameCanvas(game, options);
	}

	@post("/singlePostPreviewText/:_id")
	@use(requireAuth)
	async getSingleGameText(req: Request, res: Response) {
		const { _id } = req.params;

		//Get settings
		const settings = await getSettings();
		const overrideSettings: ISettings["singleGamePost"] | undefined = req.body.overrideSettings;

		if (overrideSettings) {
			Object.assign(settings.singleGamePost, overrideSettings);
		}

		//Get the game object
		const game = await GameController.getGameForImagePost(_id);

		if (game) {
			const result = parseGameVariablesForPost(game, settings.singleGamePost.defaultTweetText, settings);
			res.send(result);
		} else {
			GameController.send404(_id, res);
		}
	}

	@post("/singlePostPreviewImage/:_id")
	@use(requireAuth)
	async previewSingleGameImage(req: Request, res: Response) {
		const { _id } = req.params;
		const overrideSettings: ISettings["singleGamePost"] | undefined = req.body.overrideSettings;

		const game = await GameController.getGameForImagePost(_id);

		if (game) {
			const canvas = await GameController.generateSingleFixtureImage(game, overrideSettings);
			const result = await canvas.render(false);
			res.send(result);
		} else {
			GameController.send404(_id, res);
		}
	}
}
