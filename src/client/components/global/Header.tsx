//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, NavLink } from "react-router-dom";

//Interfaces
import { StoreState } from "~/client/reducers";
interface IProps {
	authUser: StoreState["config"]["authUser"];
}
interface IState {
	mobileNavActive: boolean;
}

//Redux
function mapStateToProps({ config }: StoreState) {
	const { authUser } = config;
	return { authUser };
}

//Component
import { SiteLogo } from "~/client/components/images/SiteLogo";
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

		if (authUser!.isAdmin) {
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
					<Link to={`/users/${authUser!.username}`} onClick={() => this.setState({ mobileNavActive: false })}>
						<span>{authUser!.name.first}</span>
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

export const Header = connect(mapStateToProps)(_Header);
