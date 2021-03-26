//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { GameList } from "~/client/components/games/GameList";

//Actions
import { fetchAllGames } from "~/client/actions/gameActions";
import { fetchAllTeams } from "~/client/actions/teamActions";
import { fetchAllCompetitions } from "~/client/actions/competitionActions";

//Interfaces
import { StoreState } from "~/client/reducers";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	competitions: IProps["competitions"];
	games: IProps["games"];
	teams: IProps["teams"];
}

//Redux
function mapStateToProps({ teams, games, competitions }: StoreState) {
	return { games, teams, competitions };
}
const mapDispatchToProps = { fetchAllGames, fetchAllTeams, fetchAllCompetitions };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _GameList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { games, fetchAllGames, teams, fetchAllTeams, competitions, fetchAllCompetitions } = props;
		if (!games) {
			fetchAllGames();
		}

		if (!teams) {
			fetchAllTeams();
		}

		if (!competitions) {
			fetchAllCompetitions();
		}

		this.state = { games, teams, competitions };
	}

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { games, teams, competitions } = nextProps;
		return { games, teams, competitions };
	}

	render() {
		const { games, teams, competitions } = this.state;
		const title = "Games";
		if (!games || !teams || !competitions) {
			return <LoadingPage />;
		}

		return (
			<div className="container">
				<HelmetBuilder title={title} />
				<h1>{title}</h1>
				<NavCard to={`/games/new`}>Add New Game</NavCard>
				<GameList games={Object.values(games)} />
			</div>
		);
	}
}

export const GameListPage = connector(_GameList);
