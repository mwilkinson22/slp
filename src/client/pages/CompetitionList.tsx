//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

//Components
import { ItemList } from "~/client/components/global/ItemList";
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";

//Actions
import { fetchAllCompetitions } from "~/client/actions/competitionActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { ICompetition } from "~/models/Competition";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	competitions: IProps["competitions"];
}

//Redux
function mapStateToProps({ competitions }: StoreState) {
	return { competitions };
}
const mapDispatchToProps = { fetchAllCompetitions };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _CompetitionList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { competitions, fetchAllCompetitions } = props;
		if (!props.competitions) {
			fetchAllCompetitions();
		}

		this.state = { competitions };
	}

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { competitions } = nextProps;
		return { competitions };
	}

	render() {
		const title = "Competitions";
		if (this.state.competitions) {
			return (
				<div className="container">
					<HelmetBuilder title={title} />
					<h1>{title}</h1>
					<NavCard to={`/competitions/new`}>Add New Competition</NavCard>
					<ItemList<ICompetition>
						display="name"
						itemAsPlural={"Competitions"}
						items={this.state.competitions}
						url={competition => `/competitions/${competition._id}`}
					/>
				</div>
			);
		}
		return null;
	}
}

export const CompetitionList = connector(_CompetitionList);
