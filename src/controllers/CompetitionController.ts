//Modules
import _ from "lodash";
import { Request, Response } from "express";
import axios from "axios";
import https from "https";
import { parse, Node, HTMLElement } from "node-html-parser";

//Decorators
import { controller, use, get, post, put, del } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { Competition, ICompetitionFormFieldsServerSide } from "~/models/Competition";
import { Game, IBulkGame } from "~/models/Game";

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

	//Crawl games from rugby-league.com
	@use(requireAuth)
	@get("/externalGames/:_id")
	async getExternalGames(req: Request, res: Response) {
		const { _id } = req.params;

		//Ensure valid comp
		const competition = await Competition.findById(_id);
		if (!competition) {
			return CompetitionController.send404(_id, res);
		}

		const { externalCompId } = competition;

		//Check it has a valid external competition id
		if (externalCompId == null) {
			return res.status(406).send(`The Competition ${competition.name} does not have a configured external ID`);
		}

		//Send off a web request
		let html;
		try {
			const url = "https://www.rugby-league.com/ajaxAPI";
			const params = {
				ajax: 1,
				type: "loadPlugin",
				plugin: "match_center",
				"params[limit]": 100000,
				"params[comps]": externalCompId,
				"params[compID]": externalCompId,
				"params[teamID]": "",
				"params[teamView]": "",
				"params[advert_group]": 100000,
				"params[load-more-button]": "yes",
				"params[type]": "loadmore",
				"params[preview_link]": "/match-centre/preview",
				"params[report_link]": "/match-centre/match-report",
				"params[displayType]": "fixtures",
				"params[template]": "main_match_centre.twig",
				"params[startRow]": 0
			};
			const httpsAgent = new https.Agent({ rejectUnauthorized: false });
			const headers = { "X-Requested-With": "XMLHttpRequest" };
			const { data } = await axios.get(url, { httpsAgent, headers, params });
			html = parse(data);
		} catch (e) {
			const error = `Error submitting Web Request: ${e.toString()}`;
			const toLog = { error };
			return res.status(500).send({ error, toLog });
		}

		//Get empty array to store games
		const games: IBulkGame[] = [];

		try {
			//Loop through the rows
			let date: string;
			html.childNodes.forEach((row: Node) => {
				if (row instanceof HTMLElement) {
					//Add Date
					if (row.tagName === "H3") {
						//Convert Date to Array
						const dateAsArray = row.rawText.split(" ");

						//Remove day of week
						dateAsArray.shift();

						//Remove ordinal suffix
						dateAsArray[0] = dateAsArray[0].replace(/\D/g, "");

						//Create day string
						date = dateAsArray.join(" ");
					} else if (row.tagName === "DIV" && row.classNames.indexOf("fixture-card") > -1) {
						//Check for teams.
						//There's often more than one, and we want the longest if possible.
						const getLongestName = (query: string) => {
							let str = "";

							row.querySelectorAll(query).forEach(element => {
								const text = element.rawText.toString();
								if (text.length > str.length) {
									str = text;
								}
							});

							return str;
						};
						const _homeTeam = getLongestName(".left .team-name");
						const _awayTeam = getLongestName(".right .team-name");

						if (_homeTeam && _awayTeam) {
							//Get time
							const time = row
								.querySelector(".fixture-wrap .middle")
								.rawText.trim()
								//Split by "UK: " and pop to get the local time for intl games
								.split("UK: ")
								.pop();

							//Get Round
							const roundString = row.querySelector(".fixture-footer").rawText.match(/Round: \d+/);
							let round = "";
							if (roundString) {
								round = roundString[0].replace(/\D/g, "");
							}

							//Check for tv
							const tvLogo = row.querySelector(".text-center img");

							//Add game to array
							const game: IBulkGame = {
								_homeTeam,
								_awayTeam,
								round,
								isOnTv: Boolean(tvLogo),
								date: `${date} ${time}:00`
							};
							games.push(game);
						}
					}
				}
			});
		} catch (e) {
			const error = `Error parsing game data: ${e.toString()}`;
			const toLog = { error };
			return res.status(500).send({ error, toLog });
		}

		res.send({ games });
	}
}
