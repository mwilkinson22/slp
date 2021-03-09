//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

//Components
import { ItemList } from "~/client/components/global/ItemList";
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";

//Actions
import { fetchAllUsers } from "~/client/actions/userActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
import { NotFoundPage } from "~/client/components/global/NotFoundPage";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	users: IProps["users"];
}

//Redux
function mapStateToProps({ config, users }: StoreState) {
	const { authUser } = config;
	return { authUser: authUser as IUser, users };
}
const mapDispatchToProps = { fetchAllUsers };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _UserList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { authUser, users, fetchAllUsers } = props;
		if (authUser.isAdmin && !props.users) {
			fetchAllUsers();
		}

		this.state = { users };
	}

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { users } = nextProps;
		return { users };
	}

	render() {
		const { authUser } = this.props;
		if (!authUser.isAdmin) {
			return <NotFoundPage />;
		}

		const title = "Users";
		if (this.state.users) {
			return (
				<div className="container">
					<HelmetBuilder title={title} />
					<h1>{title}</h1>
					<NavCard to={`/users/new`}>Add New User</NavCard>
					<ItemList<IUser>
						display={user => `${user.name.first} ${user.name.last}`}
						items={this.state.users}
						searchable={false}
						url={user => `/users/${user.username}`}
					/>
				</div>
			);
		}
		return null;
	}
}

export const UserList = connector(_UserList);
