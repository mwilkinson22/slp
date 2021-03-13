import _ from "lodash";
import { RouteConfig } from "react-router-config";
import { App } from "./App";

//Pages
import { Logout } from "~/client/components/auth/Logout";
import { NotFoundPage } from "~/client/components/global/NotFoundPage";

import { CompetitionPage } from "~/client/pages/CompetitionPage";
import { CompetitionList } from "~/client/pages/CompetitionList";

import { GamePage } from "~/client/pages/GamePage";
import { GameList } from "~/client/pages/GameList";

import { GroundPage } from "~/client/pages/GroundPage";
import { GroundList } from "~/client/pages/GroundList";

import { TeamPage } from "~/client/pages/TeamPage";
import { TeamList } from "~/client/pages/TeamList";

import { UserList } from "~/client/pages/UserList";
import { UserPage } from "~/client/pages/UserPage";

const routeMap = {
	"/logout": Logout,

	"/competitions/new": CompetitionPage,
	"/competitions/:_id": CompetitionPage,
	"/competitions": CompetitionList,

	"/games/new": GamePage,
	"/games/:_id": GamePage,
	"/games": GameList,

	"/grounds/new": GroundPage,
	"/grounds/:_id": GroundPage,
	"/grounds": GroundList,

	"/teams/new": TeamPage,
	"/teams/:_id": TeamPage,
	"/teams": TeamList,

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
