//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { Competition, ICompetition } from "~/models/Competition";
import { ISettings } from "~/models/Settings";
import { Game, IGameForImagePost, IGameFormFields, ISingleGamePostFields, IWeeklyPostFields } from "~/models/Game";
import { ITeam, Team } from "~/models/Team";

//Helpers
import { getSettings } from "~/controllers/SettingsController";
import { postToSocial } from "~/controllers/SocialController";
import { parseGameVariablesForPost } from "~/helpers/gameHelper";

//Canvases
import { SingleGameCanvas } from "~/canvas/SingleGameCanvas";
import { WeeklyPostCanvas } from "~/canvas/WeeklyPostCanvas";

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

	static async createDummyImageGames(forImage: true, count: number = 1): Promise<IGameForImagePost[]> {
		//Pull extra data
		const teams: ITeam[] = await Team.aggregate([{ $sample: { size: 2 * count } }]);
		const competitions: ICompetition[] = await Competition.aggregate([{ $sample: { size: 2 } }]);

		//Create basic object
		const games: IGameForImagePost[] = [];
		for (let i = 0; i < count; i++) {
			const _homeTeam = teams[i * 2];
			const _awayTeam = teams[i * 2 + 1];
			const _competition = competitions[Math.round(Math.random())];

			games.push({
				_id: "1",
				_homeTeam,
				_awayTeam,
				_competition,
				date: "2021-01-01",
				retweeted: false,
				isOnTv: false,
				overwriteHashtag: false,
				postAfterGame: false,
				includeInWeeklyPost: false,
				hashtags: ["GrandFinal"]
			});
		}

		return games;
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

	//Get game for image post
	@get("/forImagePost/:_id")
	@use(requireAuth)
	async getGameForImagePost(req: Request, res: Response) {
		const { _id } = req.params;
		const game = await GameController.getGameForImagePost(_id);
		if (game) {
			res.send(game);
		} else {
			GameController.send404(_id, res);
		}
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
	static async populateGameForImagePost(ids: string[]): Promise<IGameForImagePost[]> {
		const mongooseResult = await Game.find({ _id: { $in: ids } })
			.populate({ path: "_homeTeam" })
			.populate({ path: "_awayTeam" })
			.populate({ path: "_ground" })
			.populate({ path: "_competition" });

		//Mongoose's Typescript handling doesn't account for population,
		//and the JSON parsing makes things even messier. While casting to any and back to the correct
		//type is ugly, it works
		return JSON.parse(JSON.stringify(mongooseResult as any)) as IGameForImagePost[];
	}

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
		if (_id === "dummy") {
			const dummies = await GameController.createDummyImageGames(true, 1);
			return dummies[0];
		} else {
			const results = await GameController.populateGameForImagePost([_id]);
			return results[0] || false;
		}
	}

	static async generateSingleFixtureImage(
		game: IGameForImagePost,
		optionOverride?: Partial<ISettings["singleGamePost"]>
	) {
		//Process options
		const settingsFromDb = await getSettings<"singleGamePost">("singleGamePost");
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

	@post("/singleImagePost")
	@use(requireAuth)
	async submitSingleImagePost(req: Request, res: Response) {
		const { _id, _profile, text, postToFacebook }: ISingleGamePostFields = req.body;

		//Validate game
		const game = await GameController.getGameForImagePost(_id);
		if (!game) {
			return GameController.send404(_id, res);
		}

		//Create image
		const canvas = await GameController.generateSingleFixtureImage(game);
		const image = await canvas.render(true);

		//Post
		const result = await postToSocial(text, _profile, image, postToFacebook);

		res.send(result);
	}

	static async generateWeeklyPostImage(
		games: IGameForImagePost[],
		optionOverride?: Partial<ISettings["weeklyPost"]>
	) {
		//Process options
		const settingsFromDb = await getSettings<"weeklyPost">("weeklyPost");
		const options: ISettings["weeklyPost"] = {
			...settingsFromDb,
			...optionOverride
		};

		return new WeeklyPostCanvas(games, options);
	}

	@post("/weeklyPostPreviewImage/")
	@use(requireAuth)
	async previewWeeklyPostImage(req: Request, res: Response) {
		const gameIds: string[] | null = req.body.games;
		const overrideSettings: ISettings["weeklyPost"] | undefined = req.body.overrideSettings;

		let games: IGameForImagePost[] = [];
		if (gameIds) {
			games = await GameController.populateGameForImagePost(gameIds);

			//Check we have all the games we need
			const missingGames = gameIds.filter(_id => !games.find(g => g._id === _id));
			if (missingGames.length) {
				return GameController.send404(missingGames.join(", "), res);
			}
		}

		//Pull 8 random games
		if (!games.length) {
			const randomGames = await Game.find({}, "_id").sort("date").limit(8).lean();
			games = await GameController.populateGameForImagePost(randomGames.map(g => g._id.toString()));
		}

		//If we have no games, create 8 dummy ones
		if (!games.length) {
			games = await GameController.createDummyImageGames(true, 8);
		}

		const canvas = await GameController.generateWeeklyPostImage(games, overrideSettings);
		const result = await canvas.render(false);
		res.send(result);
	}

	@post("/weeklyPost")
	@use(requireAuth)
	async submitWeeklyPost(req: Request, res: Response) {
		const { games, _profile, text, postToFacebook }: IWeeklyPostFields = req.body;

		//Get Games
		const gameObjects = await GameController.populateGameForImagePost(games);

		//Check we have all the games we need
		const missingGames = games.filter(_id => !gameObjects.find(g => g._id === _id));
		if (missingGames.length) {
			return GameController.send404(missingGames.join(", "), res);
		}

		//Create image
		const canvas = await GameController.generateWeeklyPostImage(gameObjects);
		const image = await canvas.render(true);

		//Post
		const result = await postToSocial(text, _profile, image, postToFacebook);

		res.send(result);
	}
}
