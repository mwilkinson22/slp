import _ from "lodash";
import { RouteConfig } from "react-router-config";
import { App } from "./App";

//Pages
import { Logout } from "~/client/components/auth/Logout";
import { NotFoundPage } from "~/client/components/global/NotFoundPage";

import { HomePage } from "~/client/pages/HomePage";

import { CompetitionPage } from "~/client/pages/CompetitionPage";
import { CompetitionListPage } from "~/client/pages/CompetitionListPage";

import { GamePostPage } from "~/client/pages/GamePostPage";
import { GamePage } from "~/client/pages/GamePage";
import { GameListPage } from "~/client/pages/GameListPage";

import { GroundPage } from "~/client/pages/GroundPage";
import { GroundListPage } from "~/client/pages/GroundListPage";

import { SocialProfilePage } from "~/client/pages/settings/SocialProfilePage";

import { TeamPage } from "~/client/pages/TeamPage";
import { TeamListPage } from "~/client/pages/TeamListPage";

import { UserListPage } from "~/client/pages/UserListPage";
import { UserPage } from "~/client/pages/UserPage";

import { SettingsRouter } from "~/client/pages/settings/SettingsRouter";

const routeMap = {
	"/": HomePage,
	"/logout": Logout,

	"/competitions/new": CompetitionPage,
	"/competitions/:_id": CompetitionPage,
	"/competitions": CompetitionListPage,

	"/games/:_id/post": GamePostPage,
	"/games/new": GamePage,
	"/games/:_id": GamePage,
	"/games": GameListPage,

	"/grounds/new": GroundPage,
	"/grounds/:_id": GroundPage,
	"/grounds": GroundListPage,

	"/teams/new": TeamPage,
	"/teams/:_id": TeamPage,
	"/teams": TeamListPage,

	"/settings/social-profiles/new": SocialProfilePage,
	"/settings/social-profiles/:_id": SocialProfilePage,

	"/settings": SettingsRouter,

	"/users/new": UserPage,
	"/users/:username": UserPage,
	"/users": UserListPage
};

//Convert routeMap to route list
const routes: RouteConfig[] = _.map(routeMap, (component, path) => ({ component, path, exact: path !== "/settings" }));

//Add 404 page
routes.push({
	component: NotFoundPage,
	path: "/"
});

export default [
	{
		component: App,
		routes
	}
];
