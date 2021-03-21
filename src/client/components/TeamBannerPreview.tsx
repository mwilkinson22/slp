import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { ITeamFormFields } from "~/models/Team";
import { previewTeamBanner } from "~/client/actions/teamActions";
import { LoadingPage } from "~/client/components/global/LoadingPage";

interface IProps extends ConnectedProps<typeof connector> {
	values: ITeamFormFields;
}

interface IState {
	darkBackground: boolean;
	image: string | null;
	isLoading: boolean;
}

const connector = connect(null, { previewTeamBanner });

class _TeamBannerPreview extends Component<IProps, IState> {
	state: IState = { darkBackground: false, image: null, isLoading: false };

	async updateBannerPreview() {
		const { previewTeamBanner, values } = this.props;

		//Clear existing value
		this.setState({ isLoading: true });

		//Get banner
		const image = await previewTeamBanner(values);

		//Update state
		this.setState({ image, isLoading: false });
	}

	render() {
		const { values } = this.props;
		const { darkBackground, image, isLoading } = this.state;

		let content;
		if (isLoading) {
			content = <LoadingPage />;
		} else if (image) {
			content = <img src={image} alt={`${values.name.long} banner preview`} />;
		}

		return (
			<div className={`full-span team-banner-preview ${darkBackground ? "dark" : ""}`} key="banner-preview">
				<div className="buttons">
					<button type="button" disabled={isLoading} onClick={() => this.updateBannerPreview()}>
						{image ? "Update" : "Get"} Preview
					</button>
					<button type="button" onClick={() => this.setState({ darkBackground: !darkBackground })}>
						{darkBackground ? "Light" : "Dark"} Background
					</button>
				</div>
				{content}
			</div>
		);
	}
}

export const TeamBannerPreview = connector(_TeamBannerPreview);
