//Modules
import React from "react";

//Constants
import { imagePath } from "~/constants/extPaths";

//Interfaces
interface IProps {
	withShadow?: boolean;
}

export function SiteLogo({ withShadow }: IProps) {
	let url = `${imagePath}layout/`;
	if (withShadow) {
		url += "logo_with_shadow.png";
	} else {
		url += "logo.png";
	}

	return <img className="site-logo" src={url} alt="Super League Pod Logo" />;
}
