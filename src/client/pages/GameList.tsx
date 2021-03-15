//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { ItemList } from "~/client/components/global/ItemList";
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";

//Actions
import { fetchAllGames } from "~/client/actions/gameActions";
import { fetchAllTeams } from "~/client/actions/teamActions";

//Helpers
import { gameAsString } from "~/helpers/gameHelper";

//Interfaces
import { StoreState } from "~/client/reducers";
import { IGame } from "~/models/Game";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	games: IProps["games"];
	teams: IProps["teams"];
}

//Redux
function mapStateToProps({ teams, games }: StoreState) {
	return { games, teams };
}
const mapDispatchToProps = { fetchAllGames, fetchAllTeams };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _GameList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { games, fetchAllGames, teams, fetchAllTeams } = props;
		if (!games) {
			fetchAllGames();
		}

		if (!teams) {
			fetchAllTeams();
		}

		this.state = { games, teams };
	}

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { games, teams } = nextProps;
		return { games, teams };
	}

	render() {
		const { games, teams } = this.state;
		const title = "Games";
		if (!games || !teams) {
			return <LoadingPage />;
		}

		return (
			<div className="container">
				<HelmetBuilder title={title} />
				<h1>{title}</h1>
				<NavCard to={`/games/new`}>Add New Game</NavCard>
				<ItemList<IGame>
					display={game => gameAsString(game, teams, true)}
					itemAsPlural={"Games"}
					items={games}
					url={game => `/games/${game._id}`}
				/>
			</div>
		);
	}
}

export const GameList = connector(_GameList);
