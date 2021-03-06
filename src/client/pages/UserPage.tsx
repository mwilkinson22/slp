//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { NotFoundPage } from "~/client/components/global/NotFoundPage";
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { BasicForm } from "~/client/components/forms/BasicForm";
import { NavCard } from "~/client/components/global/NavCard";
import { HelmetBuilder } from "~/client/components/hoc/HelmetBuilder";

//Actions
import { fetchAllUsers, createUser, updateUser, deleteUser } from "~/client/actions/userActions";

//Helpers
import { getPasswordErrors, getUsernameErrors } from "~/helpers/userHelper";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
import { FormFieldTypes, IFieldAny, IFieldGroup, IFormikValues } from "~/enum/FormFieldTypes";

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	isNew: boolean;
	show404: boolean;
	user?: IUser;
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ config, users }: StoreState) {
	const { authUser } = config;
	return { authUser: authUser as IUser, users };
}
const mapDispatchToProps = { fetchAllUsers, createUser, updateUser, deleteUser };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _UserPage extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { authUser, fetchAllUsers, match, users } = props;

		//For admin users, we need the users list
		if (authUser.isAdmin && !users) {
			fetchAllUsers();
		}

		//Work out if it's a new user form
		const isNew = authUser.isAdmin && !match.params.username;

		//Otherwise, we create a validation schema
		const validationSchema: any = {
			username: Yup.string()
				.required()
				.test({
					name: "is-valid-username",
					test: function (value) {
						const error = getUsernameErrors(value || "");
						if (error) {
							return this.createError({
								message: error,
								path: "username"
							});
						}
						return true;
					}
				})
				.label("Username"),
			password: Yup.string().test({
				name: "is-valid-password",
				test: function (value) {
					//Not required on edit
					if (!isNew && !value) {
						return true;
					}

					const error = getPasswordErrors(value || "");
					if (error) {
						return this.createError({
							message: error,
							path: "password"
						});
					}
					return true;
				}
			}),
			confirmPassword: Yup.string()
				.test({
					name: "passwords-match",
					message: "Passwords Must Match",
					test: function (value) {
						return value === this.parent.password;
					}
				})
				.label("Confirm Password"),
			name: Yup.object().shape({
				first: Yup.string().required().label("First Name"),
				last: Yup.string().required().label("Last Name")
			})
		};

		if (isNew) {
			validationSchema.password = validationSchema.password.required().label("Password");
			validationSchema.confirmPassword = validationSchema.confirmPassword.required();
		} else {
			validationSchema.password = validationSchema.password.label("Change Password (Optional)");
		}

		this.state = { isNew, show404: false, validationSchema: Yup.object().shape(validationSchema) };
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> | null {
		const { authUser, match, users } = nextProps;

		//For non-admin users, we check they're only editing themselves
		if (!authUser.isAdmin) {
			const isEditingSelf = match.params.username?.toLowerCase() === authUser.username.toLowerCase();
			if (isEditingSelf) {
				return { user: authUser };
			} else {
				return { show404: true };
			}
		}

		//If we get to this stage, we know the user is an admin
		//First, we check for the users list
		if (!users) {
			return null;
		}

		//For the "new" page, we don't need to set a user object
		if (prevState.isNew) {
			return null;
		}

		//Pull the user from the list, or set it to false if we can't find a match
		const user = _.find(users, u => u.username.toLowerCase() === match.params.username.toLowerCase());
		if (user) {
			return { user };
		} else {
			return { show404: true };
		}
	}

	getInitialValues(): IFormikValues {
		const { user } = this.state;

		const defaultValues = {
			username: "",
			name: {
				first: "",
				last: ""
			},
			password: "",
			confirmPassword: ""
		};

		if (user) {
			const { username, name } = user;
			Object.assign(defaultValues, { username, name });
		}

		return defaultValues;
	}

	getFieldGroups(): IFieldGroup[] {
		const { isNew } = this.state;

		const fields: IFieldAny[] = [
			{ name: "username", type: FormFieldTypes.text, disabled: !isNew },
			{ name: "name.first", type: FormFieldTypes.text },
			{ name: "name.last", type: FormFieldTypes.text },
			{ name: "password", type: FormFieldTypes.password },
			{ name: "confirmPassword", type: FormFieldTypes.password }
		];

		return [{ fields }];
	}

	alterValuesBeforeSubmit(values: IFormikValues) {
		delete values.confirmPassword;
		if (!values.password) {
			delete values.password;
		}
	}

	render() {
		const { authUser, createUser, updateUser, deleteUser } = this.props;
		const { isNew, user, show404, validationSchema } = this.state;

		//If we've explicitly set the user to false, show a 404 page
		if (show404) {
			return <NotFoundPage />;
		}

		//Otherwise if user is undefined, show a loading spinner
		if (!isNew && !user) {
			return <LoadingPage />;
		}

		//Allow admin users to delete non-admins
		let onDelete;
		if (user && !user.isAdmin && authUser.isAdmin) {
			onDelete = () => deleteUser(user._id);
		}

		//Set submit behaviour
		let onSubmit, redirectOnSubmit;

		if (user) {
			onSubmit = (values: IFormikValues) => updateUser(user._id, values);
		} else {
			onSubmit = (values: IFormikValues) => createUser(values);
			redirectOnSubmit = (values: IFormikValues) => `/users/${values.username}`;
		}

		//Get Header
		const header = user ? `Edit ${user.username}` : "Add New User";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/users`}>Return to user list</NavCard>
					<h1>{header}</h1>
					<BasicForm
						alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType={"User"}
						onDelete={onDelete}
						onSubmit={onSubmit}
						redirectOnDelete={"/users"}
						redirectOnSubmit={redirectOnSubmit}
						showErrorSummary={false}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

export const UserPage = connector(_UserPage);
