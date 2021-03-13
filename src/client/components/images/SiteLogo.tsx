//Modules
import React from "react";
import { connect, ConnectedProps } from "react-redux";

//Redux
import { StoreState } from "~/client/reducers";
interface IProps extends ConnectedProps<typeof connector> {
	withShadow?: boolean;
}

function mapStateToProps({ config }: StoreState) {
	const { bucketPaths } = config;
	return { bucketPaths };
}
const connector = connect(mapStateToProps);

//Component
function _SiteLogo({ bucketPaths, withShadow }: IProps) {
	const url = `${bucketPaths.images.layout}${withShadow ? "logo_with_shadow" : "logo"}.png`;
	return <img className="site-logo" src={url} alt="Super League Pod Logo" />;
}
export const SiteLogo = connector(_SiteLogo);
