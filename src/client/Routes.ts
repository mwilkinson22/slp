import { App } from "./App";
import { Logout } from "~/client/components/auth/Logout";
import { NotFoundPage } from "~/client/components/global/NotFoundPage";
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
