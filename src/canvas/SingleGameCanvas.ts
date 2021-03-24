import { CanvasBuilder, TextRowBlock } from "./CanvasBuilder";
import { IGameForImagePost } from "~/models/Game";
import { ISettings } from "~/models/Settings";
import { TeamBanner } from "~/canvas/TeamBanner";

export class SingleGameCanvas extends CanvasBuilder {
	game: IGameForImagePost;
	options: ISettings["singleGamePost"];

	constructor(game: IGameForImagePost, options: ISettings["singleGamePost"]) {
		//Set Dimensions
		//Presently, this aspect ratio will prevent Twitter from cropping images
		const cWidth = 1200;
		const cHeight = Math.round(cWidth * 0.562);

		//Call parent constructor
		super(cWidth, cHeight);

		//Constants
		this.textStyles = {
			mainBlockText: {
				size: this.relativeWidth(4.5),
				family: "Roboto Slab"
			}
		};

		//Save the game to the class
		this.game = game;
		this.options = options;
	}

	async drawBackground() {
		const { ctx, cWidth, cHeight, game } = this;

		//Get the ground image
		let backgroundUrl;
		if (game._ground?.image) {
			backgroundUrl = `images/grounds/${game._ground.image}`;
		} else {
			backgroundUrl = `images/defaults/ground.jpg`;
		}
		const backgroundImage = await this.googleToCanvas(backgroundUrl);

		//If the image is successfully loaded, draw it here
		if (backgroundImage) {
			this.coverImage(backgroundImage, 0, 0, cWidth, cHeight);
		} else {
			//Otherwise, draw a dark background
			ctx.fillStyle = "#111111";
			ctx.fillRect(0, 0, cWidth, cHeight);
		}
	}

	async drawCentralBlock() {
		const { colours, ctx, cWidth, options } = this;

		//Draw main block
		ctx.fillStyle = "#000000BB";
		const blockY = this.relativeHeight(30);
		const blockHeight = this.relativeHeight(60);
		ctx.fillRect(0, blockY, cWidth, blockHeight);

		//Draw border
		ctx.fillStyle = colours.red;
		const lineHeight = this.relativeHeight(1);
		ctx.fillRect(0, blockY + lineHeight * 2, cWidth, lineHeight);
		ctx.fillRect(0, blockY + blockHeight - lineHeight * 2, cWidth, lineHeight);

		//Add logo
		const logo = await this.googleToCanvas("images/layout/logo.png");
		if (logo) {
			const logoMargin = this.relativeHeight(8);
			this.containImage(
				logo,
				this.relativeWidth(4),
				blockY + logoMargin,
				this.relativeWidth(35),
				blockHeight - logoMargin * 2
			);
		}

		//Add text
		this.setTextStyle("mainBlockText");
		ctx.fillStyle = colours.white;
		const rows: TextRowBlock[][] = options.defaultImageText.split("\n").map(content => [{ content }]);
		this.textBuilder(rows, this.relativeWidth(40), blockY + blockHeight / 2, { xAlign: "left", lineHeight: 1.6 });
	}

	async drawTopBanners() {
		const { game, options } = this;
		const bannerY = this.relativeHeight(7);
		const bannerHeight = this.relativeHeight(14);

		//Determine game logo now so we can correctly render the team banners
		//First, try to get a game-specific image
		const logoYOverlay = bannerHeight * 0.1;
		const logoY = bannerY - logoYOverlay;
		const logoHeight = bannerHeight + logoYOverlay * 2;
		let logo;
		if (game.image) {
			logo = await this.googleToCanvas(`images/games/${game.image}`);
		}
		//If that fails, try the competition image
		if (!logo && game._competition.image) {
			logo = await this.googleToCanvas(`images/competitions/${game._competition.image}`);
		}

		//Grab the width and save for later
		let logoWidth = 0;
		if (logo) {
			//Try to be as accurate as possible.
			//Scale it down to the correct height and then work out the width from that
			const scaleFactor = logo.height / logoHeight;
			const scaledWidth = Math.round(logo.width / scaleFactor);

			//Potentially use this width, but limit it at 20% of the total canvas
			logoWidth = Math.min(this.relativeWidth(18), scaledWidth);
		}

		//Home Team
		const homeClass = new TeamBanner(
			game._homeTeam,
			options.teamName,
			true,
			this.relativeWidth(50),
			bannerHeight,
			logoWidth / 2
		);
		const homeBanner = await homeClass.renderForCanvas();
		this.containImage(homeBanner, 0, bannerY, this.relativeWidth(50), bannerHeight);

		//Away Team
		const awayClass = new TeamBanner(
			game._awayTeam,
			options.teamName,
			false,
			this.relativeWidth(50),
			bannerHeight,
			logoWidth / 2
		);
		const awayBanner = await awayClass.renderForCanvas();
		this.containImage(awayBanner, this.relativeWidth(50), bannerY, this.relativeWidth(50), bannerHeight);

		//Finally, fill in the game logo, if we have one
		if (logo) {
			const logoX = this.relativeWidth(50) - logoWidth / 2;
			this.containImage(logo, logoX, logoY, logoWidth, logoHeight);
		}
	}

	async render(forTwitter: boolean = false) {
		await this.drawBackground();
		await this.drawTopBanners();
		await this.drawCentralBlock();
		return this.outputFile(forTwitter ? "twitter" : "base64");
	}
}
