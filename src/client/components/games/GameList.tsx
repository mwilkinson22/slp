//Modules
import React from "react";
import { connect, ConnectedProps } from "react-redux";

//Models
import { IGame } from "~/models/Game";

//Interfaces
import { StoreState } from "~/client/reducers";
import { ItemList } from "~/client/components/global/ItemList";
import { GameListEntry } from "~/client/components/games/GameListEntry";
import { getTeamNamesAndTitle } from "~/helpers/gameHelper";

interface IProps extends ConnectedProps<typeof connector> {
	games: IGame[];
}

//Redux
function mapStateToProps({ competitions, teams }: StoreState) {
	return { competitions, teams };
}
const connector = connect(mapStateToProps);

//Component
function _GameList({ competitions, games, teams }: IProps) {
	if (!competitions) {
		throw new Error("Competitions must be loaded before accessing GameList");
	}

	if (!teams) {
		throw new Error("Teams must be loaded before accessing GameList");
	}

	return (
		<div className="game-list">
			<ItemList<IGame>
				display={game => {
					const { teamNames, title } = getTeamNamesAndTitle(game, teams, competitions);
					return { content: <GameListEntry game={game} />, textValue: `${teamNames} ${title}` };
				}}
				listItemClassName={"game-list-entry"}
				itemAsPlural={"Games"}
				items={games}
				sortBy={game => new Date(game.date).getTime()}
				url={game => `/games/${game._id}`}
			/>
		</div>
	);
}

export const GameList = connector(_GameList);
