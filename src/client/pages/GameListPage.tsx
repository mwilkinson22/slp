//Modules
import _ from "lodash";
import React, { Component, ReactNode } from "react";
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
class _GameListPage extends Component<IProps, IState> {
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
		const title = "Games";
		if (!games || !teams || !competitions) {
			return <LoadingPage />;
		}

		//Loop through all the games we have and sort by last week, this week, next week and future
		//We group by one of the above strings, and prefix it with a number to ease sorting.
		const gamesByTimeframe = _.chain(games)
			//Sort by date now, so we know the groups will be in order
			.sortBy(game => new Date(game.date))
			//Group by Game Week
			.groupBy(game => getGameWeek(game, settings))
			.value();

		//Go through the above group and convert to game lists
		const gameLists: ReactNode[] = [];
		for (const group in gamesByTimeframe) {
			//No point showing the title if there's just one group
			let title;
			if (Object.keys(gamesByTimeframe).length > 1) {
				title = <h2>{group}</h2>;
			}

			gameLists.push(
				<div key={group}>
					{title}
					<GameList games={gamesByTimeframe[group]} />
				</div>
			);
		}

		//Display an empty list if we have no games
		if (gameLists.length === 0) {
			gameLists.push(<GameList games={[]} key="empty" />);
		}

		return (
			<div className="game-list-page">
				<div className="container">
					<HelmetBuilder title={title} />
					<h1>{title}</h1>
					<NavCard to={`/games/new`}>Add New Game</NavCard>
					{gameLists}
				</div>
			</div>
		);
	}
}

export const GameListPage = connector(_GameListPage);
