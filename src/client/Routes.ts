import _ from "lodash";
import { RouteConfig } from "react-router-config";
import { App } from "./App";

//Pages
import { Logout } from "~/client/components/auth/Logout";
import { NotFoundPage } from "~/client/components/global/NotFoundPage";

import { CompetitionPage } from "~/client/pages/CompetitionPage";
import { CompetitionList } from "~/client/pages/CompetitionList";

import { GroundPage } from "~/client/pages/GroundPage";
import { GroundList } from "~/client/pages/GroundList";

import { UserList } from "~/client/pages/UserList";
import { UserPage } from "~/client/pages/UserPage";

const routeMap = {
	"/logout": Logout,

	"/competitions/new": CompetitionPage,
	"/competitions/:_id": CompetitionPage,
	"/competitions": CompetitionList,

	"/grounds/new": GroundPage,
	"/grounds/:_id": GroundPage,
	"/grounds": GroundList,

	"/users/new": UserPage,
	"/users/:username": UserPage,
	"/users": UserList
};

const routes: RouteConfig[] = _.map(routeMap, (component, path) => ({ component, path, exact: true }));
routes.push({
	component: () => NotFoundPage({}),
	path: "/"
});

export default [
	{
		component: App,
		routes
	}
];
