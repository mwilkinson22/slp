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
import { fetchAllGrounds, createGround, updateGround, deleteGround } from "~/client/actions/groundActions";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
import { IGround } from "~/models/Ground";
import { FormFieldTypes, IFieldAny, IFieldGroup, IFormikValues } from "~/enum/FormFieldTypes";

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	isNew: boolean;
	show404: boolean;
	ground?: IGround;
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ config, grounds }: StoreState) {
	const { authUser } = config;
	return { authUser: authUser as IUser, grounds };
}
const mapDispatchToProps = { fetchAllGrounds, createGround, updateGround, deleteGround };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _GroundPage extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { fetchAllGrounds, match, grounds } = props;

		//Ensure we have grounds list
		if (!grounds) {
			fetchAllGrounds();
		}

		//Work out if it's a new user form
		const isNew = !match.params._id;

		//Create a validation schema
		const validationSchema = Yup.object().shape({
			name: Yup.string().required().label("Name"),
			addTheToTweets: Yup.boolean().label("Add 'the' to tweets"),
			city: Yup.string().required().label("City")
		});

		this.state = { isNew, show404: false, validationSchema };
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> | null {
		const { match, grounds } = nextProps;

		//First, we check for the grounds list
		if (!grounds) {
			return null;
		}

		//For the "new" page, we don't need to set a ground object
		if (prevState.isNew) {
			return null;
		}

		//Pull the ground from the list, or set it to false if we can't find a match
		const ground = grounds[match.params._id];
		if (ground) {
			return { ground };
		} else {
			return { show404: true };
		}
	}

	getInitialValues(): IFormikValues {
		const { ground } = this.state;

		const defaultValues: Partial<IGround> = {
			name: "",
			addTheToTweets: false,
			city: ""
		};

		if (ground) {
			return _.mapValues(defaultValues, (defaultValue, field: keyof IGround) => {
				return ground[field] ?? defaultValue;
			});
		}

		return defaultValues;
	}

	getFieldGroups(): IFieldGroup[] {
		const fields: IFieldAny[] = [
			{ name: "name", type: FormFieldTypes.text },
			{ name: "addTheToTweets", type: FormFieldTypes.boolean },
			{ name: "city", type: FormFieldTypes.text }
		];

		return [{ fields }];
	}

	render() {
		const { authUser, createGround, updateGround, deleteGround } = this.props;
		const { isNew, ground, show404, validationSchema } = this.state;

		//If we've explicitly set the user to false, show a 404 page
		if (show404) {
			return <NotFoundPage message="Ground not found" />;
		}

		//Otherwise if ground is undefined, show a loading spinner
		if (!isNew && !ground) {
			return <LoadingPage />;
		}

		//Allow admin users to delete
		let onDelete;
		if (ground && authUser.isAdmin) {
			onDelete = () => deleteGround(ground._id);
		}

		//Set submit behaviour
		let onSubmit, redirectOnSubmit;
		if (ground) {
			onSubmit = (values: IFormikValues) => updateGround(ground._id, values);
		} else {
			onSubmit = (values: IFormikValues) => createGround(values);
			redirectOnSubmit = (values: IFormikValues) => `/grounds/${values._id}`;
		}

		//Get Header
		const header = ground ? `Edit ${ground.name}` : "Add New Ground";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/grounds`}>Return to ground list</NavCard>
					<h1>{header}</h1>
					<BasicForm
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType={"Ground"}
						onDelete={onDelete}
						onSubmit={onSubmit}
						redirectOnDelete={"/grounds"}
						redirectOnSubmit={redirectOnSubmit}
						showErrorSummary={false}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

export const GroundPage = connector(_GroundPage);
