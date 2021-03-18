import React from "react";
import { RouteComponentProps } from "react-router-dom";
import { Helmet } from "react-helmet";

interface IProps extends Partial<RouteComponentProps<any>> {
	message?: string;
}

export function NotFoundPage(props: IProps) {
	return (
		<div className="container not-found-page">
			<Helmet>
				<meta name="robots" content="NOINDEX, NOFOLLOW" />
			</Helmet>
			<h1>404 - {props.message ?? "Page Not Found"}</h1>
		</div>
	);
}
