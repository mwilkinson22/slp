//Modules
import _ from "lodash";
import React, { Component, ComponentType } from "react";
import { connect, ConnectedProps } from "react-redux";
import { Switch, Route, RouteComponentProps } from "react-router-dom";

//Components
import { ErrorBoundary } from "~/client/components/hoc/ErrorBoundary";
import { NotFoundPage } from "~/client/components/global/NotFoundPage";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";
import { NavCard } from "~/client/components/global/NavCard";
import { ItemList } from "~/client/components/global/ItemList";

//Interfaces
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps {}

//Settings Pages
import { SingleGamePostSettings } from "~/client/pages/settings/SingleGamePostSettings";

//Page List
type SettingsPage = {
	path: string;
	title: string;
	component: ComponentType<any>;
};
const SettingsPages: SettingsPage[] = [
	{ path: "single-game-post", title: "Single Game Post", component: SingleGamePostSettings }
];

//Redux
function mapStateToProps({ config, users }: StoreState) {
	const { authUser } = config;
	return { authUser: authUser as IUser, users };
}
const connector = connect(mapStateToProps);

//Component
class _SettingsRouter extends Component<IProps> {
	formatComponent(pageTitle: string, Component: SettingsPage["component"], routeProps: RouteComponentProps<any>) {
		const title = `Settings - ${pageTitle}`;
		return (
			<div>
				<HelmetBuilder title={title} />
				<NavCard to={"/settings"}>Return to Settings Page</NavCard>
				<h1>{title}</h1>
				<ErrorBoundary>
					<Component {...routeProps} content={pageTitle} />
				</ErrorBoundary>
			</div>
		);
	}

	formatList() {
		const settingsList = (
			<ItemList<SettingsPage>
				display={"title"}
				items={_.keyBy(SettingsPages, "path")}
				searchable={false}
				url={({ path }) => `/settings/${path}`}
			/>
		);

		return (
			<div>
				<h1>Settings</h1>
				{settingsList}
			</div>
		);
	}

	render() {
		//Admin only
		const { authUser } = this.props;
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		//Convert page list to Switch Routes
		const routes = SettingsPages.map(page => (
			<Route
				path={`/settings/${page.path}`}
				exact={true}
				render={(routeProps: RouteComponentProps<any>) =>
					this.formatComponent(page.title, page.component, routeProps)
				}
				key={page.path}
			/>
		));

		//Add a root route with the settings list
		routes.push(<Route path="/settings/" exact={true} render={() => this.formatList()} key="root" />);

		//And finally add a catch-all 404
		routes.push(<Route path="/" component={NotFoundPage} key="404" />);

		return (
			<div className="container">
				<HelmetBuilder title={"Settings"} />
				<Switch>{routes}</Switch>
			</div>
		);
	}
}

export const SettingsRouter = connector(_SettingsRouter);
