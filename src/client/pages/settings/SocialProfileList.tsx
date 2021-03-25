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
import { fetchAllSocialProfiles, setDefaultSocialProfile } from "~/client/actions/socialActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { ISocialProfile } from "~/models/SocialProfile";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	isUpdatingDefault: boolean;
	socialProfiles: IProps["socialProfiles"];
}

//Redux
function mapStateToProps({ socialProfiles }: StoreState) {
	return { socialProfiles };
}
const mapDispatchToProps = { fetchAllSocialProfiles, setDefaultSocialProfile };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _SocialProfileList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { socialProfiles, fetchAllSocialProfiles } = props;
		if (!socialProfiles) {
			fetchAllSocialProfiles();
		}

		this.state = { isUpdatingDefault: false, socialProfiles };
	}

	static getDerivedStateFromProps(nextProps: IProps): Partial<IState> {
		const { socialProfiles } = nextProps;
		return { socialProfiles };
	}

	handleSetDefault(ev: React.MouseEvent<HTMLButtonElement, MouseEvent>, _id: string) {
		const { setDefaultSocialProfile } = this.props;

		//Prevent Link Click
		ev.preventDefault();
		ev.stopPropagation();

		//Disable buttons
		this.setState({ isUpdatingDefault: true });

		//Update default
		setDefaultSocialProfile(_id);

		//Re-enable buttons
		this.setState({ isUpdatingDefault: false });
	}

	render() {
		const { isUpdatingDefault, socialProfiles } = this.state;
		const title = "Social Profiles";

		if (!socialProfiles) {
			return <LoadingPage />;
		}

		return (
			<div className="social-profile-list">
				<HelmetBuilder title={title} />
				<NavCard to={`/settings/social-profiles/new`}>Add New Profile</NavCard>
				<ItemList<ISocialProfile>
					display={profile => {
						//Append default text or button where necessary
						let content;
						if (profile.isDefault) {
							content = <div>{profile.name} (Default)</div>;
						} else {
							content = (
								<div className="social-profile-list-entry">
									<span>{profile.name}</span>
									<button
										type="button"
										onClick={ev => this.handleSetDefault(ev, profile._id)}
										disabled={isUpdatingDefault}
									>
										Set Default
									</button>
								</div>
							);
						}

						return {
							content,
							textValue: (profile.isDefault ? "0" : "1") + profile.name
						};
					}}
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
