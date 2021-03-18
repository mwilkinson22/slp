//Modules
import React, { Component, ErrorInfo, ReactNode } from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";

interface IProps extends RouteComponentProps<any> {
	children: ReactNode;
	showCloseButton?: boolean;
}

interface IState {
	message?: string;
	componentStack?: ErrorInfo["componentStack"];
	page?: string;
}

export class _ErrorBoundary extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);
		this.state = {};
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		//Get the uri where the error occurred
		const page = this.props.location.pathname;

		//Get the message
		const { message } = error;

		//Get the component stack
		const { componentStack } = info;

		//Update the state to render fallback component
		this.setState({ message, componentStack, page });
	}

	render() {
		const { showCloseButton } = this.props;
		const { componentStack, message } = this.state;

		if (message) {
			let closeButton = <span />;
			if (showCloseButton) {
				closeButton = <span onClick={() => this.setState({ message: undefined })}>{"\u2716"}</span>;
			}

			return (
				<div className="container">
					<div className="error-boundary">
						<h2>
							<span>Error</span>
							{closeButton}
						</h2>
						<div className="data">
							<div className="message">{message}</div>
						</div>
						<pre>{componentStack}</pre>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

export const ErrorBoundary = withRouter(_ErrorBoundary);
