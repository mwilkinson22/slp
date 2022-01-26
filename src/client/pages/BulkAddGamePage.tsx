//Modules
import React, { Component } from "react";
import { RouteComponentProps } from "react-router-dom";

//Components
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { BulkGameCompetitionSelector } from "~/client/components/games/bulk/BulkGameCompetitionSelector";
import { IBulkGame } from "~/models/Game";
import { BulkGameTeamSelector } from "~/client/components/games/bulk/BulkGameTeamSelector";
import { LoadingPage } from "~/client/components/global/LoadingPage";

interface IProps extends RouteComponentProps<any> {}
interface IState {
	_competition?: string;
	rawGames?: IBulkGame[];
	isLoadingGames: boolean;
	gamesToConfirm?: IBulkGame[];
}

//Types

//Component
export class BulkAddGamePage extends Component<IProps, IState> {
	state: IState = { isLoadingGames: false };

	resetState() {
		this.setState({ _competition: undefined, rawGames: undefined, gamesToConfirm: undefined });
	}

	renderCompetitionSelector() {
		return (
			<BulkGameCompetitionSelector
				onStartCheck={_competition => {
					this.resetState();
					this.setState({
						isLoadingGames: true,
						_competition
					});
				}}
				onComplete={rawGames => this.setState({ rawGames, isLoadingGames: false })}
			/>
		);
	}

	renderTeamSelector() {
		const { gamesToConfirm, rawGames, isLoadingGames } = this.state;
		if (isLoadingGames) {
			return <LoadingPage />;
		}

		if (rawGames && !gamesToConfirm) {
			if (rawGames.length) {
				return (
					<BulkGameTeamSelector
						games={rawGames}
						onComplete={gamesToConfirm => this.setState({ gamesToConfirm })}
					/>
				);
			} else {
				return <div className="form-card">No games were found for this competition.</div>;
			}
		}
	}

	renderGameConfirmation() {
		const { gamesToConfirm } = this.state;
		if (gamesToConfirm) {
			console.log(gamesToConfirm);
			return null;
		}
	}

	render() {
		//Get Header
		const header = "Bulk Add Games";
		return (
			<section className="admin-page bulk-game-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/games`}>Return to game list</NavCard>
					<h1>{header}</h1>
					{this.renderCompetitionSelector()}
					{this.renderTeamSelector()}
					{this.renderGameConfirmation()}
				</div>
			</section>
		);
	}
}
