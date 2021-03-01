import React from "react";
import { App } from "./App";
import { Logout } from "~/client/components/auth/Logout";
import { NotFoundPage } from "~/client/components/global/NotFoundPage";

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
				component: () => React.createElement("p", { children: "Hello World" }),
				path: "/",
				exact: true
			},
			{
				component: () => NotFoundPage({}),
				path: "/"
			}
		]
	}
];
