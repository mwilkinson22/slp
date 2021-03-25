import React, { Component } from "react";
import { LoadingPage } from "~/client/components/global/LoadingPage";

interface IProps {
	allowReloading: boolean;
	darkBackgroundToggle?: boolean;
	getData: () => Promise<string | null>;
	loadOnFirstRender?: boolean;
	renderContent: "image" | "plainText" | "textarea";
}

interface IState {
	darkBackground: boolean;
	data: string | null;
	isLoading: boolean;
}

export class ServerContentPreview extends Component<IProps, IState> {
	static defaultProps = {
		allowReloading: true,
		darkBackgroundToggle: false,
		loadOnFirstRender: false
	};
	state: IState = { darkBackground: false, data: null, isLoading: false };

	componentDidMount() {
		if (this.props.loadOnFirstRender) {
			this.updateBannerPreview().then();
		}
	}

	async updateBannerPreview() {
		const { getData } = this.props;

		//Clear existing value
		this.setState({ isLoading: true });

		//Get banner
		const data = await getData();

		//Update state
		this.setState({ data, isLoading: false });
	}

	renderLoadButton() {
		const { allowReloading } = this.props;
		const { data, isLoading } = this.state;

		if (!allowReloading && data) {
			return null;
		}

		return (
			<button type="button" disabled={isLoading} onClick={() => this.updateBannerPreview()}>
				{data ? "Update" : "Get"} Preview
			</button>
		);
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
		const { renderContent } = this.props;
		const { darkBackground, data, isLoading } = this.state;

		let content;
		if (isLoading) {
			content = <LoadingPage />;
		} else if (data) {
			switch (renderContent) {
				case "image":
					content = <img src={data} alt="Image Preview" />;
					break;
				case "textarea":
					content = <textarea disabled={true}>{data}</textarea>;
					break;
				case "plainText":
					content = data;
					break;
			}
		}

		return (
			<div className={`full-span server-content-preview ${darkBackground ? "dark" : ""}`} key="banner-preview">
				<div className="buttons">
					{this.renderLoadButton()}
					{this.renderDarkButton()}
				</div>
				{content}
			</div>
		);
	}
}
