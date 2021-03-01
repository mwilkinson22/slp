//Modules
import React from "react";
import { Request } from "express";
import { Store } from "redux";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { renderRoutes } from "react-router-config";
import serialize from "serialize-javascript";
import { Helmet } from "react-helmet";

//Routes
import Routes from "~/client/Routes";

export default (req: Request, store: Store, context: {}) => {
	const content = renderToString(
		<Provider store={store}>
			<StaticRouter location={req.path} context={context}>
				<div className="wrapper">{renderRoutes(Routes)}</div>
			</StaticRouter>
		</Provider>
	);

	const helmet = Helmet.renderStatic();
	return `
		<html lang="en">
			<head>
				<meta charset="utf-8">
    			<meta name="viewport" content="width=device-width, initial-scale=1.0">
    			<meta name="theme-color" content="#086b32">
				<link rel="stylesheet" type="text/css" href="/styles.css" />
				<link href="https://fonts.googleapis.com/css2?family=Roboto+Slab|Open+Sans" rel="stylesheet"> 
				<title>Super League Pod</title>
				${helmet.title.toString()}
				${helmet.meta.toString()}
			</head>
			<body>
				<div id="root">${content}</div>
				<script>window.INITIAL_STATE = ${serialize(store.getState())}</script>
				<script src="/bundle.js"></script>
			</body>
		</html>
	`;
};
