import React from "react";
import { Helmet } from "react-helmet";

interface IProps {
	title?: string;
}
export function HelmetBuilder({ title }: IProps) {
	const titleArr = ["Super League Pod"];
	if (title) {
		titleArr.push(title);
	}

	return <Helmet title={titleArr.join(" - ")} />;
}
