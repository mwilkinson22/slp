import { App } from "./App";
import { Logout } from "~/client/components/auth/Logout";
import { NotFoundPage } from "~/client/components/global/NotFoundPage";

import { UserPage } from "~/client/pages/UserPage";
import { UserList } from "~/client/pages/UserList";

export default [
	{
		component: App,
		routes: [
			{
				component: Logout,
				path: "/logout",
				exact: true
			},
			{
				component: UserPage,
				path: "/users/new",
				exact: true
			},
			{
				component: UserPage,
				path: "/users/:username",
				exact: true
			},
			{
				component: UserList,
				path: "/users",
				exact: true
			},
			{
				component: () => NotFoundPage({}),
				path: "/"
			}
		]
	}
];
