import _ from "lodash";
import { CanvasBuilder, TextRowBlock } from "./CanvasBuilder";
import { IGameForImagePost } from "~/models/Game";
import { ISettings } from "~/models/Settings";
import { TeamBanner } from "~/canvas/TeamBanner";

export class WeeklyPostCanvas extends CanvasBuilder {
	games: IGameForImagePost[];
	options: ISettings["weeklyPost"];
	dimensions: {
		canvasPadding: number;
		competitionHeight: number;
		competitionMarginTop: number;
		gameHeight: number;
		gameMarginTop: number;
		mainLogo: number;
	};

	constructor(games: IGameForImagePost[], options: ISettings["weeklyPost"]) {
		//Define width & dummy height, as we'll dynamically adjust the height after we've called super
		const cWidth = 1000;
		const cHeight = 1000;

		//Call parent constructor
		super(cWidth, cHeight);

		//Define component dimensions
		this.dimensions = {
			canvasPadding: this.relativeWidth(6),
			competitionHeight: this.relativeWidth(8),
			competitionMarginTop: this.relativeWidth(3),
			gameHeight: this.relativeWidth(4),
			gameMarginTop: this.relativeWidth(1),
			mainLogo: this.relativeWidth(20)
		};

		//Total Competitions
		const totalCompetitions = _.uniqBy(games, g => g._competition._id).length;

		//Calculate height dynamically
		const dynamicHeight =
			//Top & Bottom Padding
			this.dimensions.canvasPadding * 2 +
			//Main Logo
			this.dimensions.mainLogo +
			//Height & margin for each competition
			this.dimensions.competitionHeight * totalCompetitions +
			this.dimensions.competitionMarginTop * totalCompetitions +
			//Height + Margin for each game
			this.dimensions.gameHeight * games.length +
			this.dimensions.gameMarginTop * games.length;
		this.resizeCanvas(undefined, dynamicHeight);

		//Add text styles
		this.textStyles = {
			competitionBackup: {
				size: this.dimensions.competitionHeight / 3,
				family: "Roboto Slab"
			},
			header: {
				size: this.dimensions.mainLogo / 6,
				family: "Roboto Slab"
			}
		};

		//Save the games and options to the class
		this.games = games;
		this.options = options;
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight } = this;

		// Create gradient
		const gradient = ctx.createLinearGradient(this.relativeWidth(50), 0, this.relativeWidth(50), cHeight);
		gradient.addColorStop(0, "#f4f4f4");
		gradient.addColorStop(1, "#b4b4b4");

		// Fill with gradient
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, cWidth, cHeight);
	}

	async drawHeader() {
		const { ctx, colours, cWidth, dimensions, options } = this;
		//Add background
		const backgroundBoxHeight = dimensions.mainLogo * 0.75;
		const backgroundBoxY = dimensions.canvasPadding + (dimensions.mainLogo - backgroundBoxHeight) / 2;
		ctx.fillStyle = "#880000AA";
		ctx.fillRect(0, backgroundBoxY, cWidth, backgroundBoxHeight);

		//Add logo
		const logo = await this.googleToCanvas("images/layout/logo.png");
		const logoX = dimensions.canvasPadding * 2.2;
		if (logo) {
			this.containImage(logo, logoX, dimensions.canvasPadding, dimensions.mainLogo);
		}

		//Add text
		this.setTextStyle("header");
		ctx.fillStyle = colours.white;
		const rows: TextRowBlock[][] = options.defaultImageText.split("\n").map(content => [{ content }]);
		this.textBuilder(
			rows,
			dimensions.mainLogo / 2 + this.relativeWidth(50),
			backgroundBoxY + backgroundBoxHeight / 2,
			{
				lineHeight: 1.4
			}
		);
	}

	async drawGames() {
		const { ctx, cWidth, dimensions, games, options } = this;
		let y = dimensions.canvasPadding + dimensions.mainLogo;

		const groupedGames = _.chain(games)
			//Sort Games by Date
			.sortBy(g => new Date(g.date))
			//Group By competition
			.groupBy(g => g._competition._id)
			.value();

		for (const _competition in groupedGames) {
			//Add competition margin
			y += dimensions.competitionMarginTop;

			//Get the competition logo
			const competition = groupedGames[_competition][0]._competition;
			const competitionLogo = await this.googleToCanvas(`images/competitions/${competition.image}`);
			if (competitionLogo) {
				this.containImage(competitionLogo, 0, y, cWidth, dimensions.competitionHeight);
			} else {
				ctx.fillStyle = "black";
				ctx.textAlign = "center";
				this.setTextStyle("competitionBackup");
				ctx.fillText(competition.name, this.relativeWidth(50), y + dimensions.competitionHeight * 0.65);
			}
			y += dimensions.competitionHeight;

			//Loop games
			for (const game of groupedGames[_competition]) {
				//Add margin
				y += dimensions.gameMarginTop;

				//Draw team banners
				const teamBannerWidth = this.relativeWidth(50) - dimensions.canvasPadding;
				const homeBannerClass = new TeamBanner(
					game._homeTeam,
					options.teamName,
					true,
					teamBannerWidth,
					dimensions.gameHeight,
					0
				);
				const homeBanner = await homeBannerClass.renderForCanvas(true);
				this.containImage(homeBanner, dimensions.canvasPadding, y, teamBannerWidth, dimensions.gameHeight);

				const awayBannerClass = new TeamBanner(
					game._awayTeam,
					options.teamName,
					false,
					teamBannerWidth,
					dimensions.gameHeight,
					0
				);
				const awayBanner = await awayBannerClass.renderForCanvas(true);
				this.containImage(awayBanner, this.relativeWidth(50), y, teamBannerWidth, dimensions.gameHeight);
				y += dimensions.gameHeight;
			}
		}
	}

	async render(forTwitter: boolean = false) {
		await this.drawBackground();
		await this.drawHeader();
		await this.drawGames();
		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
