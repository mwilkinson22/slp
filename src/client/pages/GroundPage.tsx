//Modules
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
import { createGround, deleteGround, fetchAllGrounds, updateGround } from "~/client/actions/groundActions";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
import { IGround } from "~/models/Ground";
import { FormFieldTypes, IFieldGroup } from "~/enum/FormFieldTypes";

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	isNew: boolean;
	show404: boolean;
	ground?: IGround;
	validationSchema: Yup.ObjectSchema;
}
export interface GroundFields extends Required<Omit<IGround, "_id">> {}

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
			tweetName: Yup.string().required().label("Name in Tweets"),
			city: Yup.string().required().label("City"),
			image: Yup.string().label("Image")
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

	getInitialValues(): GroundFields {
		const { ground } = this.state;

		if (ground) {
			return {
				name: ground.name,
				tweetName: ground.tweetName || "",
				city: ground.city,
				image: ground.image || ""
			};
		} else {
			return {
				name: "",
				tweetName: "",
				city: "",
				image: ""
			};
		}
	}

	getFieldGroups(): IFieldGroup<GroundFields>[] {
		const { grounds } = this.props;
		const { ground } = this.state;

		//Create image dependency check
		let dependentCheck;
		if (grounds) {
			dependentCheck = (filename: string) => {
				const dependents = Object.values(grounds)
					//If we have a ground object, exclude it from this check
					.filter(({ _id }) => !ground || _id !== ground._id)
					//Look for any grounds using this image
					.filter(({ image }) => image === filename)
					//Pull off the ground name
					.map(({ name }) => name);
				return {
					dataType: "Grounds",
					dependents
				};
			};
		}

		return [
			{
				fields: [
					{ name: "name", type: FormFieldTypes.text, placeholder: "John Smith's Stadium" },
					{ name: "tweetName", type: FormFieldTypes.text, placeholder: "the John Smith's" },
					{ name: "city", type: FormFieldTypes.text },
					{
						name: "image",
						type: FormFieldTypes.image,
						path: "images/grounds/",
						sizeForSelector: "thumbnail",
						dependentCheck,
						resize: {
							thumbnail: { width: 200 }
						}
					}
				]
			}
		];
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
			onSubmit = (values: GroundFields) => updateGround(ground._id, values);
		} else {
			onSubmit = (values: GroundFields) => createGround(values);
			redirectOnSubmit = (ground: IGround) => `/grounds/${ground._id}`;
		}

		//Get Header
		const header = ground ? `Edit ${ground.name}` : "Add New Ground";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/grounds`}>Return to ground list</NavCard>
					<h1>{header}</h1>
					<BasicForm<GroundFields, IGround>
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
