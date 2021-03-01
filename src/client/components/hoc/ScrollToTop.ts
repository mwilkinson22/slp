import { Component, ReactNode } from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";

interface IProps extends RouteComponentProps {
	children: ReactNode;
}

class _ScrollToTop extends Component<IProps> {
	componentDidUpdate(prevProps: Readonly<IProps>) {
		if (this.props.location !== prevProps.location) {
			window.scrollTo(0, 0);
		}
	}

	render() {
		return this.props.children;
	}
}

export const ScrollToTop = withRouter(_ScrollToTop);
