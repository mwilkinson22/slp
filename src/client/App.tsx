//Modules
import "datejs";
import React, { Component } from "react";
import { connect } from "react-redux";
import { renderRoutes, RouteConfigComponentProps } from "react-router-config";
import { RouteComponentProps } from "react-router-dom";

//Components
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { ErrorBoundary } from "~/client/components/hoc/ErrorBoundary";
import { ScrollToTop } from "./components/hoc/ScrollToTop";
import { Header } from "./components/global/Header";
import { Login } from "./components/auth/Login";

//Interfaces
import { StoreState } from "~/client/reducers";
interface IState {
	authUser?: StoreState["config"]["authUser"];
}
interface IProps extends IState, RouteComponentProps, RouteConfigComponentProps {}

//Redux
function mapStateToProps({ config }: StoreState) {
	const { authUser } = config;
	return { authUser };
}

//App Component
class _App extends Component<IProps, IState> {
	state: IState = {};

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { authUser } = nextProps;
		return { authUser };
	}

	componentDidMount() {
		document.addEventListener("keydown", this.handleKeyPress);
	}

	handleKeyPress(ev: KeyboardEvent) {
		const { keyCode, ctrlKey, shiftKey, altKey } = ev;
		if (ctrlKey && shiftKey && altKey && keyCode === 83) {
			window.location.href = "/admin";
		}
	}

	render() {
		const { route } = this.props;
		const { authUser } = this.state;

		if (!authUser) {
			return <Login />;
		}

		return (
			<ErrorBoundary>
				<ScrollToTop>
					<HelmetBuilder />
					<Header />
					<div className="main">
						<ErrorBoundary showCloseButton={true}>{renderRoutes(route?.routes)}</ErrorBoundary>
					</div>
				</ScrollToTop>
			</ErrorBoundary>
		);
	}
}

export const App = connect(mapStateToProps)(_App);
