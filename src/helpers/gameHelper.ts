import { IGame, IGameForImagePost } from "~/models/Game";
import { ITeam } from "~/models/Team";
import { dateToHMS } from "~/helpers/genericHelper";
import { ISettings } from "~/models/Settings";
import { ICompetition } from "~/models/Competition";

//Convert game to string
export function gameAsString(game: IGame, teams: Record<string, ITeam>, withTime?: boolean) {
	const { _homeTeam, _awayTeam, date } = game;
	const home = teams[_homeTeam];
	const away = teams[_awayTeam];
	const dateObject = new Date(date);
	let result = `${home.name.short} vs ${away.name.short} - ${dateObject.toLocaleDateString()}`;

	if (withTime) {
		result += ` ${dateToHMS(dateObject).substr(0, 5)}`;
	}

	return result;
}

//Parse a block of text and map in game variables
type GameVariableMapEntry = {
	getValue: (game: IGameForImagePost, settings: ISettings) => string;
	description: string;
};
export const gameVariableMap: Record<string, GameVariableMapEntry> = {
	timeCheck: {
		description: "today/tonight",
		getValue: game => (new Date(game.date).getHours() > 17 ? "today" : "tonight")
	},
	homeFull: { description: "Home Team's Full Name", getValue: game => game._homeTeam.name.long },
	homeShort: { description: "Home Team's Short Name", getValue: game => game._homeTeam.name.short },
	homeNickname: { description: "Home Team's Nickname", getValue: game => game._homeTeam.nickname },
	awayFull: { description: "Away Team's Full Name", getValue: game => game._awayTeam.name.long },
	awayShort: { description: "Away Team's Short Name", getValue: game => game._awayTeam.name.short },
	awayNickname: { description: "Away Team's Nickname", getValue: game => game._awayTeam.nickname },
	ground: {
		description: "Ground Name",
		getValue: (game, settings) => game._ground?.tweetName || settings.singleGamePost.backupGroundText
	},
	competition: { description: "Competition", getValue: game => game._competition.name },
	hashtags: {
		description: "Game Hashtags",
		getValue: game => game.hashtags.map(t => `#${t}`).join(" ")
	},
	googleForm: {
		description: "Google Form",
		getValue: (game, settings) => settings.googleForm.link
	}
};
export function parseGameVariablesForPost(game: IGameForImagePost, text: string, settings: ISettings) {
	for (const variable in gameVariableMap) {
		const regex = new RegExp(`%${variable}%`, "gi");
		const value = gameVariableMap[variable].getValue(game, settings);
		text = text.replace(regex, value);
	}

	return text;
}

export function getTeamNamesAndTitle(
	game: IGame,
	teams: Record<string, ITeam>,
	competitions: Record<string, ICompetition>
) {
	//Teams
	const teamNames = `${teams[game._homeTeam].name.short} vs ${teams[game._awayTeam].name.short}`;

	//Comp & Round
	let round = "";
	if (game.round) {
		//If it's just a number, we prefix it with "Round"
		round = parseInt(game.round) ? `Round ${game.round}` : game.round;
	}
	const title = `${competitions[game._competition].name} ${round}`.trim();

	return { teamNames, title };
}

type GameWeek = "Last Week" | "This Week" | "Next Week" | "Future Games";
export function getGameWeek(game: IGame, settings: ISettings): GameWeek {
	//To get proper "this/next" week boundaries, we use the weekly-post deadline date
	const dayStrings = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
	const dayToEndWeek = dayStrings[parseInt(settings.weeklyPost.postDate)];
	const startOfThisWeek = Date.parse(`last ${dayToEndWeek}`).addDays(1);
	const differenceInMs = new Date(game.date).getTime() - startOfThisWeek.getTime();
	const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
	if (differenceInDays < 0) {
		return "Last Week";
	}

	if (differenceInDays < 7) {
		return "This Week";
	}

	if (differenceInDays < 14) {
		return "Next Week";
	}

	return "Future Games";
}
