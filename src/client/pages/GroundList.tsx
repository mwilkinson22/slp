//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

//Components
import { ItemList } from "~/client/components/global/ItemList";
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";

//Actions
import { fetchAllGrounds } from "~/client/actions/groundActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { IGround } from "~/models/Ground";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	grounds: IProps["grounds"];
}

//Redux
function mapStateToProps({ grounds }: StoreState) {
	return { grounds };
}
const mapDispatchToProps = { fetchAllGrounds };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _GroundList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { grounds, fetchAllGrounds } = props;
		if (!props.grounds) {
			fetchAllGrounds();
		}

		this.state = { grounds };
	}

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { grounds } = nextProps;
		return { grounds };
	}

	render() {
		const title = "Grounds";
		if (this.state.grounds) {
			return (
				<div className="container">
					<HelmetBuilder title={title} />
					<h1>{title}</h1>
					<NavCard to={`/grounds/new`}>Add New Ground</NavCard>
					<ItemList<IGround>
						display={({ name, city }) => `${name}, ${city}`}
						itemAsPlural={"Grounds"}
						items={this.state.grounds}
						url={ground => `/grounds/${ground._id}`}
					/>
				</div>
			);
		}
		return null;
	}
}

export const GroundList = connector(_GroundList);
