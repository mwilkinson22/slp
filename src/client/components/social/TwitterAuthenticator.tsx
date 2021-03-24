//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import NewWindow from "react-new-window";

//Actions
import { validateTwitterApp, getAuthorisedAccounts } from "~/client/actions/socialActions";

//Interfaces
import { ISettings } from "~/models/Settings";
import { FormikProps } from "formik";
import { ISocialProfileFormFields } from "~/models/SocialProfile";

interface IProps extends ConnectedProps<typeof connector> {
	formik: FormikProps<ISocialProfileFormFields>;
	values: ISettings["twitterApp"];
}
interface IState {
	isAuthorising: boolean;
}

//Redux
const connector = connect(null, { getAuthorisedAccounts, validateTwitterApp });

class _TwitterAuthenticator extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		this.state = { isAuthorising: false };
	}

	renderAuthWindow() {
		const { formik, getAuthorisedAccounts } = this.props;
		const { isAuthorising } = this.state;

		if (isAuthorising) {
			return (
				<NewWindow
					key="twitter-auth-window"
					url={"/api/social/oauth/twitter/authorise"}
					onUnload={async () => {
						//Get accounts, with secret
						const authorisedCredentials = await getAuthorisedAccounts();

						//If we find something, update the form
						if (authorisedCredentials) {
							formik.setFieldValue("twitter_access_token", authorisedCredentials.access_token);
							formik.setFieldValue(
								"twitter_access_token_secret",
								authorisedCredentials.access_token_secret
							);
						}

						//Reset state
						this.setState({ isAuthorising: false });
					}}
				/>
			);
		}
	}

	render() {
		const { isAuthorising } = this.state;
		return (
			<div className="buttons" key="validation">
				<button type="button" onClick={() => this.setState({ isAuthorising: true })} disabled={isAuthorising}>
					Authorise via Twitter
				</button>
				{this.renderAuthWindow()}
			</div>
		);
	}
}

export const TwitterAuthenticator = connector(_TwitterAuthenticator);
