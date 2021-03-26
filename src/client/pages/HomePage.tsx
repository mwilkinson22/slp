//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { GameList } from "~/client/components/games/GameList";
import { NavCard } from "~/client/components/global/NavCard";

//Actions
import { fetchAllGames } from "~/client/actions/gameActions";
import { fetchAllTeams } from "~/client/actions/teamActions";
import { fetchAllCompetitions } from "~/client/actions/competitionActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { ISettings } from "~/models/Settings";
import { getGameWeek } from "~/helpers/gameHelper";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	competitions: IProps["competitions"];
	games: IProps["games"];
	teams: IProps["teams"];
}

//Redux
function mapStateToProps({ config, teams, games, competitions }: StoreState) {
	const { settings } = config;
	return { games, teams, competitions, settings: settings as ISettings };
}
const mapDispatchToProps = { fetchAllGames, fetchAllTeams, fetchAllCompetitions };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _HomePage extends Component<IProps, IState> {
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
		const { settings } = this.props;
		const { games, teams, competitions } = this.state;
		if (!games || !teams || !competitions) {
			return <LoadingPage />;
		}

		//Get this week's games
		const gamesThisWeek = _.filter(games, game => getGameWeek(game, settings) === "This Week");

		//Weekly post link
		let weeklyPostLink;
		if (gamesThisWeek.length) {
			weeklyPostLink = <NavCard to="/games/weekly-post">Manually Submit Weekly Post</NavCard>;
		}

		return (
			<div className="game-list-page">
				<div className="container">
					<h1>Games This Week</h1>
					{weeklyPostLink}
					<GameList games={gamesThisWeek} />
				</div>
			</div>
		);
	}
}

export const HomePage = connector(_HomePage);
