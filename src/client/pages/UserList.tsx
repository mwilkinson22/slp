//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

//Components
import { ItemList } from "~/client/components/global/ItemList";

//Actions
import { fetchAllUsers } from "~/client/actions/userActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
import { NavCard } from "~/client/components/global/NavCard";
interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	users: IProps["users"];
}

//Redux
function mapStateToProps({ config, users }: StoreState) {
	const { authUser } = config;
	return { authUser, users };
}
const mapDispatchToProps = { fetchAllUsers };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _UserList extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { authUser, users, fetchAllUsers } = props;
		if (authUser!.isAdmin && !props.users) {
			fetchAllUsers();
		}

		this.state = { users };
	}

	static getDerivedStateFromProps(nextProps: IProps): IState {
		const { users } = nextProps;
		return { users };
	}

	render() {
		if (this.state.users) {
			return (
				<div className="container">
					<h1>Users</h1>
					<NavCard to={`/users/new`}>Add New User</NavCard>
					<ItemList<IUser>
						display={user => `${user.name.first} ${user.name.last}`}
						items={this.state.users}
						sortBy={user => user.name.first}
						url={user => `/users/${user.username}`}
					/>
				</div>
			);
		}
		return null;
	}
}

export const UserList = connector(_UserList);
