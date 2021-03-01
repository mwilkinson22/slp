import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { withRouter, RouteComponentProps } from "react-router-dom";
import { logout } from "../../actions/userActions";
import { LoadingPage } from "../global/LoadingPage";

//Interface
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}

//Redux
const connector = connect(null, { logout });

function _Logout({ logout, history }: IProps) {
	logout().then(() => {
		history.replace("/");
	});
	return <LoadingPage />;
}

export const Logout = withRouter(connector(_Logout));
