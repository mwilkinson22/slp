//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { NotFoundPage } from "~/client/components/global/NotFoundPage";
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { BasicForm } from "~/client/components/forms/BasicForm";
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { TwitterValidator } from "~/client/components/social/TwitterValidator";

//Actions
import {
	createSocialProfile,
	deleteSocialProfile,
	fetchAllSocialProfiles,
	updateSocialProfile
} from "~/client/actions/socialActions";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
import { ISocialProfile, ISocialProfileFormFields } from "~/models/SocialProfile";
import { FormFieldTypes, IFieldGroup } from "~/enum/FormFieldTypes";
import { ISettings } from "~/models/Settings";
import { TwitterAuthenticator } from "~/client/components/social/TwitterAuthenticator";
import { FormikProps } from "formik";

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	isNew: boolean;
	show404: boolean;
	socialProfile?: ISocialProfile;
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ config, socialProfiles }: StoreState) {
	const { authUser, settings } = config;
	return { authUser: authUser as IUser, settings, socialProfiles };
}

const mapDispatchToProps = { fetchAllSocialProfiles, createSocialProfile, updateSocialProfile, deleteSocialProfile };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _SocialProfilePage extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { fetchAllSocialProfiles, match, socialProfiles } = props;

		//Ensure we have social profiles list
		if (!socialProfiles) {
			fetchAllSocialProfiles();
		}

		//Work out if it's a new entry
		const isNew = !match.params._id;

		//Create a validation schema
		const validationSchema = Yup.object().shape({
			name: Yup.string().required().label("Name"),
			twitter_access_token: Yup.string().required().label("Access Token"),
			twitter_access_token_secret: Yup.string().required().label("Access Token Secret"),
			ifttt_key: Yup.string().label("IFTTT Key")
		});

		this.state = { isNew, show404: false, validationSchema };
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> | null {
		const { match, socialProfiles } = nextProps;

		//First, we check for the social profiles list
		if (!socialProfiles) {
			return null;
		}

		//For the "new" page, we don't need to set a socialProfile object
		if (prevState.isNew) {
			return null;
		}

		//Pull the profile from the list, or set it to false if we can't find a match
		const socialProfile = socialProfiles[match.params._id];
		if (socialProfile) {
			return { socialProfile };
		} else {
			return { show404: true };
		}
	}

	getInitialValues(): ISocialProfileFormFields {
		const { socialProfile } = this.state;

		if (socialProfile) {
			return {
				name: socialProfile.name,
				twitter_access_token: socialProfile.twitter_access_token,
				twitter_access_token_secret: socialProfile.twitter_access_token_secret,
				ifttt_key: socialProfile.ifttt_key || ""
			};
		} else {
			return {
				name: "",
				twitter_access_token: "",
				twitter_access_token_secret: "",
				ifttt_key: ""
			};
		}
	}

	getFieldGroups(values: ISocialProfileFormFields): IFieldGroup<ISocialProfileFormFields>[] {
		const { settings } = this.props;

		const fieldsToValidate: ISettings["twitterApp"] = {
			consumer_key: settings.twitterApp.consumer_key,
			consumer_secret: settings.twitterApp.consumer_secret,
			access_token: values.twitter_access_token,
			access_token_secret: values.twitter_access_token_secret
		};

		return [
			{
				fields: [{ name: "name", type: FormFieldTypes.text }]
			},
			{
				label: "Twitter",
				fields: [
					{ name: "twitter_access_token", type: FormFieldTypes.text },
					{ name: "twitter_access_token_secret", type: FormFieldTypes.text }
				]
			},
			{
				render: (values: ISocialProfileFormFields, formik: FormikProps<ISocialProfileFormFields>) => (
					<TwitterAuthenticator formik={formik} key="authenticate" values={fieldsToValidate} />
				)
			},
			{
				render: () => (
					<TwitterValidator
						values={fieldsToValidate}
						key={"validator" + values.twitter_access_token + values.twitter_access_token_secret}
					/>
				)
			},
			{
				label: "IFTTT (Facebook posting)",
				fields: [{ name: "ifttt_key", type: FormFieldTypes.text }]
			}
		];
	}

	render() {
		const { authUser, createSocialProfile, updateSocialProfile, deleteSocialProfile } = this.props;
		const { isNew, socialProfile, show404, validationSchema } = this.state;

		//Ensure this is admin-only
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		//If we've explicitly set the profile to false, show a 404 page
		if (show404) {
			return <NotFoundPage message="Social Profile not found" />;
		}

		//Otherwise if socialProfile is undefined, show a loading spinner
		if (!isNew && !socialProfile) {
			return <LoadingPage />;
		}

		//Set submit behaviour
		let onSubmit, redirectOnSubmit, onDelete, defaultDeleteDisclaimer;
		if (socialProfile) {
			onSubmit = (values: ISocialProfileFormFields) => updateSocialProfile(socialProfile._id, values);
			if (socialProfile.isDefault) {
				defaultDeleteDisclaimer = (
					<div className="form-card card">This profile is the current default, and cannot be deleted</div>
				);
			} else {
				onDelete = () => deleteSocialProfile(socialProfile._id);
			}
		} else {
			onSubmit = (values: ISocialProfileFormFields) => createSocialProfile(values);
			redirectOnSubmit = (socialProfile: ISocialProfile) => `/settings/social-profiles/${socialProfile._id}`;
		}

		//Get Header
		const header = socialProfile ? `Edit ${socialProfile.name}` : "Add New Social Profile";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/settings/social-profiles`}>Return to social profile list</NavCard>
					<h1>{header}</h1>
					<BasicForm<ISocialProfileFormFields, ISocialProfile>
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType={"Social Profile"}
						onDelete={onDelete}
						onSubmit={onSubmit}
						redirectOnDelete={"/settings/social-profiles"}
						redirectOnSubmit={redirectOnSubmit}
						showErrorSummary={false}
						validationSchema={validationSchema}
					/>
					{defaultDeleteDisclaimer}
				</div>
			</section>
		);
	}
}

export const SocialProfilePage = connector(_SocialProfilePage);
