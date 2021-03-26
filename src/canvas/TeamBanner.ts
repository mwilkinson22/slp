import { CanvasBuilder, TextRowBlock } from "./CanvasBuilder";
import { Canvas } from "canvas";
import { ISettings } from "~/models/Settings";
import { ITeam } from "~/models/Team";

type TeamName = ISettings["singleGamePost"]["teamName"];
export class TeamBanner extends CanvasBuilder {
	constructor(
		private team: ITeam,
		private teamNameFormat: TeamName,
		private leftAlign: boolean,
		width: number,
		height: number,
		private endPadding: number = 0
	) {
		//Initialise canvas
		super(width, height);

		//Add text style
		this.textStyles = {
			teamName: {
				size: this.relativeHeight(teamNameFormat === "long" ? 50 : 60),
				family: "Jersey"
			}
		};
	}

	private drawBackground() {
		const { ctx, team, cWidth, cHeight } = this;

		//Draw the background colour
		ctx.fillStyle = team.colours.main;
		ctx.fillRect(0, 0, cWidth, cHeight);
	}

	private async getBadge() {
		return this.googleToCanvas(`images/teams/${this.team.image}`);
	}

	private async drawBanner() {
		const { ctx, cHeight, cWidth, endPadding, leftAlign, team, teamNameFormat } = this;

		//Draw the background
		this.drawBackground();

		//Draw the trim
		ctx.fillStyle = team.colours.trim;
		const trimHeight = this.relativeHeight(10);
		ctx.fillRect(0, cHeight - trimHeight, cWidth, trimHeight);

		//Declare contentHeight - the drawable area
		const contentHeight = cHeight - trimHeight;

		//Draw the badge
		const badgeYPadding = this.relativeHeight(10);
		const badgeXPadding = this.relativeWidth(3);
		const badgeHeight = contentHeight - badgeYPadding * 2;
		const badge = await this.getBadge();

		let badgeWidth;
		if (badge) {
			//Draw the image but let it span the whole width, since we'll be auto-aligning anyway
			const containedImage = this.containImage(
				badge,
				badgeXPadding,
				badgeYPadding,
				cWidth - badgeXPadding * 2,
				badgeHeight,
				{
					xAlign: leftAlign ? "left" : "right"
				}
			);
			//Update the badgeWidth
			badgeWidth = containedImage.destinationW;
		} else {
			//If the badge can't be found, don't leave space for it
			badgeWidth = 0;
		}

		//Add the team name
		ctx.fillStyle = team.colours.text;
		this.setTextStyle("teamName");
		let teamName;
		switch (teamNameFormat) {
			case "nickname":
				teamName = team.nickname.replace(/^the /gi, "");
				break;
			default:
				teamName = team.name[teamNameFormat];
				break;
		}

		const totalBadgeWidth = badgeWidth ? badgeWidth + badgeXPadding : 0;
		const maxWidth = cWidth - totalBadgeWidth - endPadding - badgeXPadding * 2;
		const imageTextBuffer = (totalBadgeWidth - endPadding) / 2;
		let textX = this.relativeWidth(50);
		if (leftAlign) {
			textX += imageTextBuffer;
		} else {
			textX -= imageTextBuffer;
		}

		const textRowBlock: TextRowBlock = { content: teamName, maxWidth };
		this.textBuilder([[textRowBlock]], textX, this.relativeHeight(50, contentHeight));
	}

	private async drawBannerForWeeklyPost() {
		const { ctx, cHeight, cWidth, leftAlign, team, teamNameFormat } = this;

		//Draw the background
		this.drawBackground();

		//Draw badge
		const badge = await this.getBadge();
		let xOffset = 0;
		if (badge) {
			const badgeWidth = this.relativeHeight(200);
			const badgeOverhang = this.relativeHeight(30);
			xOffset = badgeWidth - badgeOverhang;
			this.coverImage(
				badge,
				leftAlign ? 0 - badgeOverhang : cWidth - badgeWidth + badgeOverhang,
				0,
				badgeWidth,
				cHeight
			);
		}

		//Add team name
		ctx.fillStyle = team.colours.text;
		this.setTextStyle("teamName");
		let teamName;
		if (teamNameFormat === "nickname") {
			teamName = team.nickname;
		} else {
			teamName = team.name[teamNameFormat];
		}
		const textRowBlock: TextRowBlock = { content: teamName, maxWidth: cWidth - xOffset };
		this.textBuilder(
			[[textRowBlock]],
			this.relativeWidth(50) + (leftAlign ? xOffset : -xOffset) / 2,
			this.relativeHeight(50)
		);
	}

	async renderForCanvas(forWeeklyPost: boolean): Promise<Canvas> {
		if (forWeeklyPost) {
			await this.drawBannerForWeeklyPost();
		} else {
			await this.drawBanner();
		}
		return this.canvas;
	}

	async renderToBase64(): Promise<string> {
		await this.drawBanner();
		return this.outputFile("base64") as string;
	}
}
