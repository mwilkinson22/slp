import React, { Component } from "react";
import { LoadingPage } from "~/client/components/global/LoadingPage";

interface IProps {
	darkBackgroundToggle?: boolean;
	getImage: () => Promise<string | null>;
	loadImageOnFirstRender?: boolean;
}

interface IState {
	darkBackground: boolean;
	image: string | null;
	isLoading: boolean;
}

export class CanvasPreview extends Component<IProps, IState> {
	defaultProps = {
		darkBackgroundToggle: "Image",
		loadImageOnFirstRender: true,
		title: "Image"
	};
	state: IState = { darkBackground: false, image: null, isLoading: false };

	componentDidMount() {
		if (this.props.loadImageOnFirstRender) {
			this.updateBannerPreview().then();
		}
	}

	async updateBannerPreview() {
		const { getImage } = this.props;

		//Clear existing value
		this.setState({ isLoading: true });

		//Get banner
		const image = await getImage();

		//Update state
		this.setState({ image, isLoading: false });
	}

	renderDarkButton() {
		const { darkBackgroundToggle } = this.props;
		const { darkBackground } = this.state;
		if (darkBackgroundToggle) {
			return (
				<button type="button" onClick={() => this.setState({ darkBackground: !darkBackground })}>
					{darkBackground ? "Light" : "Dark"} Background
				</button>
			);
		}
	}

	render() {
		const { darkBackground, image, isLoading } = this.state;

		let content;
		if (isLoading) {
			content = <LoadingPage />;
		} else if (image) {
			content = <img src={image} alt="Preview Image" />;
		}

		return (
			<div className={`full-span canvas-preview ${darkBackground ? "dark" : ""}`} key="banner-preview">
				<div className="buttons">
					<button type="button" disabled={isLoading} onClick={() => this.updateBannerPreview()}>
						{image ? "Update" : "Get"} Preview
					</button>
					{this.renderDarkButton()}
				</div>
				{content}
			</div>
		);
	}
}
