//Modules
import React, { Component } from "react";
import { RouteComponentProps } from "react-router-dom";

//Components
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { BulkGameCompetitionSelector } from "~/client/components/games/bulk/BulkGameCompetitionSelector";

interface IProps extends RouteComponentProps<any> {}
interface IState {}

//Component
export class BulkAddGamePage extends Component<IProps, IState> {
	state = {};

	render() {
		//Get Header
		const header = "Bulk Add Games";
		return (
			<section className="admin-page bulk-game-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/games`}>Return to game list</NavCard>
					<h1>{header}</h1>
					<BulkGameCompetitionSelector />
				</div>
			</section>
		);
	}
}
