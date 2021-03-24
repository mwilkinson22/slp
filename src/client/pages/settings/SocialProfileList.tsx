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
import { fetchAllSocialProfiles } from "~/client/actions/socialActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { ISocialProfile } from "~/models/SocialProfile";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	socialProfiles: IProps["socialProfiles"];
}

//Redux
function mapStateToProps({ socialProfiles }: StoreState) {
	return { socialProfiles };
}
const mapDispatchToProps = { fetchAllSocialProfiles };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _SocialProfileList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { socialProfiles, fetchAllSocialProfiles } = props;
		if (!socialProfiles) {
			fetchAllSocialProfiles();
		}

		this.state = { socialProfiles };
	}

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { socialProfiles } = nextProps;
		return { socialProfiles };
	}

	render() {
		const { socialProfiles } = this.state;
		const title = "Social Profiles";

		if (!socialProfiles) {
			return <LoadingPage />;
		}

		return (
			<div>
				<HelmetBuilder title={title} />
				<NavCard to={`/settings/social-profiles/new`}>Add New Profile</NavCard>
				<ItemList<ISocialProfile>
					display="name"
					itemAsPlural={"Social Profiles"}
					items={socialProfiles}
					searchable={false}
					url={social => `/settings/social-profiles/${social._id}`}
				/>
			</div>
		);
	}
}

export const SocialProfileList = connector(_SocialProfileList);
