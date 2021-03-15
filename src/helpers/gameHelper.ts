import { IGame } from "~/models/Game";
import { ITeam } from "~/models/Team";
import { dateToHMS } from "~/helpers/genericHelper";

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
