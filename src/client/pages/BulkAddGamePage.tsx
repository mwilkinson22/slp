//Modules
import React, { Component } from "react";
import { RouteComponentProps } from "react-router-dom";

//Components
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { BulkGameCompetitionSelector } from "~/client/components/games/bulk/BulkGameCompetitionSelector";
import { BulkGameTeamSelector } from "~/client/components/games/bulk/BulkGameTeamSelector";
import { BulkGameConfirmation } from "~/client/components/games/bulk/BulkGameConfirmation";
import { LoadingPage } from "~/client/components/global/LoadingPage";

//Interfaces & Enums
import { IBulkGame } from "~/models/Game";

interface IProps extends RouteComponentProps<any> {}
interface IState {
	isLoadingGames: boolean;
	isSavingGames: boolean;
	_competition?: string;
	rawGames?: IBulkGame[];
	gamesToConfirm?: IBulkGame[];
}

//Component
export class BulkAddGamePage extends Component<IProps, IState> {
	state: IState = { isLoadingGames: false, isSavingGames: false };

	resetState() {
		this.setState({
			_competition: undefined,
			rawGames: undefined,
			gamesToConfirm: undefined,
			isLoadingGames: false,
			isSavingGames: false
		});
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
		const { _competition, gamesToConfirm } = this.state;
		if (_competition && gamesToConfirm) {
			return <BulkGameConfirmation _competition={_competition} gamesToConfirm={gamesToConfirm} />;
		}
	}

	render() {
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
