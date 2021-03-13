import { IGame } from "~/models/Game";
import { ITeam } from "~/models/Team";

export function gameAsString(game: IGame, teams: Record<string, ITeam>) {
	const { _homeTeam, _awayTeam, date } = game;
	const home = teams[_homeTeam];
	const away = teams[_awayTeam];
	const dateObject = new Date(date);
	return `${home.name.short} vs ${away.name.short} - ${dateObject.toLocaleDateString()}`;
}
