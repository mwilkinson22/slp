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
import { fetchAllTeams } from "~/client/actions/teamActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { ITeam } from "~/models/Team";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	teams: IProps["teams"];
}

//Redux
function mapStateToProps({ config, teams }: StoreState) {
	const { bucketPaths } = config;
	return { bucketPaths, teams };
}
const mapDispatchToProps = { fetchAllTeams };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _TeamList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { teams, fetchAllTeams } = props;
		if (!props.teams) {
			fetchAllTeams();
		}

		this.state = { teams };
	}

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { teams } = nextProps;
		return { teams };
	}

	render() {
		const { bucketPaths } = this.props;
		const title = "Teams";
		if (!this.state.teams) {
			return <LoadingPage />;
		}

		return (
			<div className="container">
				<HelmetBuilder title={title} />
				<h1>{title}</h1>
				<NavCard to={`/teams/new`}>Add New Team</NavCard>
				<ItemList<ITeam>
					display={t => {
						const textValue = t.name.long;
						const content = (
							<div className="team-list-entry">
								<div className="image-wrapper">
									<img
										src={`${bucketPaths.images.teams}thumbnail/${t.image}`}
										alt={`${t.name.long} Badge`}
									/>
								</div>
								<span>{t.name.long}</span>
							</div>
						);
						return { textValue, content };
					}}
					itemAsPlural={"Teams"}
					items={this.state.teams}
					sortBy={t => `${t.isFavourite ? "A" : "B"}${t.name.long}`}
					url={team => `/teams/${team._id}`}
				/>
			</div>
		);
	}
}

export const TeamListPage = connector(_TeamList);
