//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { Link, NavLink } from "react-router-dom";
import { ToastContainer, Slide } from "react-toastify";

//Components
import { SiteLogo } from "~/client/components/images/SiteLogo";

//Interfaces
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
interface IProps extends ConnectedProps<typeof connector> {}
interface IState {
	mobileNavActive: boolean;
}

//Redux
function mapStateToProps({ config }: StoreState) {
	const { authUser } = config;
	return { authUser: authUser as IUser };
}
const connector = connect(mapStateToProps);

//Class
class _Header extends Component<IProps, IState> {
	state = { mobileNavActive: false };

	renderPageLinks() {
		const { authUser } = this.props;
		const pages = {
			Home: "/",
			Competitions: "/competitions",
			Games: "/games",
			Grounds: "/grounds",
			Teams: "/teams"
		};

		if (authUser.isAdmin) {
			Object.assign(pages, {
				Users: "/users",
				Settings: "/settings"
			});
		}

		const navLinks = _.map(pages, (url, title) => (
			<NavLink key={url} to={url} exact={url === "/"} onClick={() => this.setState({ mobileNavActive: false })}>
				{title}
			</NavLink>
		));

		return <nav>{navLinks}</nav>;
	}

	render() {
		const { authUser } = this.props;
		const { mobileNavActive } = this.state;

		return (
			<header>
				<Link to="/">
					<SiteLogo withShadow={true} />
				</Link>
				<div className="mobile-nav-button" onClick={() => this.setState({ mobileNavActive: true })}>
					<span />
					<span />
					<span />
				</div>
				<div className={`nav-wrapper${mobileNavActive ? " active" : ""}`}>
					{this.renderPageLinks()}
					<ToastContainer className={"toast-wrapper"} position={"bottom-left"} transition={Slide} />
					<Link to={`/users/${authUser.username}`} onClick={() => this.setState({ mobileNavActive: false })}>
						<span>{authUser.name.first}</span>
					</Link>
					<Link to="/logout">
						<span>Logout</span>
					</Link>
				</div>
				<div className="mobile-nav-background" onClick={() => this.setState({ mobileNavActive: false })} />
			</header>
		);
	}
}

export const Header = connector(_Header);
