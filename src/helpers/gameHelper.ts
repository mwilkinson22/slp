import { IGame, IGameForImagePost } from "~/models/Game";
import { ITeam } from "~/models/Team";
import { dateToHMS } from "~/helpers/genericHelper";
import { ISettings } from "~/models/Settings";

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
	homeFull: { description: "Home Team's full name", getValue: game => game._homeTeam.name.long },
	homeShort: { description: "Home Team's short name", getValue: game => game._homeTeam.name.short },
	homeNickname: { description: "Home Team's nickname", getValue: game => game._homeTeam.nickname },
	awayFull: { description: "Away Team's full name", getValue: game => game._awayTeam.name.long },
	awayShort: { description: "Away Team's short name", getValue: game => game._awayTeam.name.short },
	awayNickname: { description: "Away Team's nickname", getValue: game => game._awayTeam.nickname },
	ground: {
		description: "Ground's 'Name in Tweets' value. If the game has no ground, we use 'Backup Ground Text'",
		getValue: (game, settings) => game._ground?.tweetName || settings.singleGamePost.backupGroundText
	},
	competition: { description: "Competition Name", getValue: game => game._competition.name },
	hashtags: {
		description: "All hashtags for the game",
		getValue: game => game.hashtags.map(t => `#${t}`).join(" ")
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
