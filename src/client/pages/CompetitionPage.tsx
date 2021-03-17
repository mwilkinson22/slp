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
import {
	createCompetition,
	deleteCompetition,
	fetchAllCompetitions,
	updateCompetition
} from "~/client/actions/competitionActions";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
import { ICompetition } from "~/models/Competition";
import { FormFieldTypes, IFieldAny, IFieldGroup } from "~/enum/FormFieldTypes";
import { validateHashtag } from "~/helpers/genericHelper";

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	isNew: boolean;
	show404: boolean;
	competition?: ICompetition;
	validationSchema: Yup.ObjectSchema;
}
export interface CompetitionFields extends Required<Omit<ICompetition, "_id">> {}

//Redux
function mapStateToProps({ config, competitions }: StoreState) {
	const { authUser } = config;
	return { authUser: authUser as IUser, competitions };
}
const mapDispatchToProps = { fetchAllCompetitions, createCompetition, updateCompetition, deleteCompetition };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _CompetitionPage extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { fetchAllCompetitions, match, competitions } = props;

		//Ensure we have competitions list
		if (!competitions) {
			fetchAllCompetitions();
		}

		//Work out if it's a new user form
		const isNew = !match.params._id;

		//Create a validation schema
		const hashtagTest = {
			name: "is-valid-hashtag",
			message: "Hashtags can only contain letters, numbers and underscores",
			test: (value: any) => {
				if (value) {
					return validateHashtag(value);
				}
				return true;
			}
		};
		const validationSchema = Yup.object().shape({
			name: Yup.string().required().label("Name"),
			hashtagPrefix: Yup.string().required().test(hashtagTest).label("Hashtag Prefix"),
			competitionHashtag: Yup.string().test(hashtagTest).label("Competition Hashtag"),
			isFavourite: Yup.bool().label("Mark as favourite?"),
			image: Yup.string().required().label("Image")
		});

		this.state = { isNew, show404: false, validationSchema };
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> | null {
		const { match, competitions } = nextProps;

		//First, we check for the competitions list
		if (!competitions) {
			return null;
		}

		//For the "new" page, we don't need to set a competition object
		if (prevState.isNew) {
			return null;
		}

		//Pull the competition from the list, or set it to false if we can't find a match
		const competition = competitions[match.params._id];
		if (competition) {
			return { competition };
		} else {
			return { show404: true };
		}
	}

	getInitialValues(): CompetitionFields {
		const { competition } = this.state;

		if (competition) {
			return {
				name: competition.name,
				hashtagPrefix: competition.hashtagPrefix,
				competitionHashtag: competition.competitionHashtag || "",
				isFavourite: competition.isFavourite,
				image: competition.image
			};
		} else {
			return {
				name: "",
				hashtagPrefix: "",
				competitionHashtag: "",
				isFavourite: false,
				image: ""
			};
		}
	}

	getFieldGroups(): IFieldGroup<CompetitionFields>[] {
		const { competitions } = this.props;
		const { competition } = this.state;

		//Create image dependency check
		let dependentCheck;
		if (competitions) {
			dependentCheck = (filename: string) => {
				const dependents = Object.values(competitions)
					//If we have a competition object, exclude it from this check
					.filter(({ _id }) => !competition || _id !== competition._id)
					//Look for any competitions using this image
					.filter(({ image }) => image === filename)
					//Pull off the competition name
					.map(({ name }) => name);
				return {
					dataType: "Competitions",
					dependents
				};
			};
		}
		const fields: IFieldAny<CompetitionFields>[] = [
			{ name: "name", type: FormFieldTypes.text },
			{ name: "hashtagPrefix", type: FormFieldTypes.text },
			{
				name: "competitionHashtag",
				type: FormFieldTypes.text,
				placeholder: "Auto-generated if left blank"
			},
			{ name: "isFavourite", type: FormFieldTypes.boolean },
			{
				name: "image",
				type: FormFieldTypes.image,
				path: "images/competitions/",
				sizeForSelector: "thumbnail",
				dependentCheck,
				resize: {
					thumbnail: { width: 200 }
				}
			}
		];

		return [{ fields }];
	}

	render() {
		const { authUser, createCompetition, updateCompetition, deleteCompetition } = this.props;
		const { isNew, competition, show404, validationSchema } = this.state;

		//If we've explicitly set the user to false, show a 404 page
		if (show404) {
			return <NotFoundPage message="Competition not found" />;
		}

		//Otherwise if competition is undefined, show a loading spinner
		if (!isNew && !competition) {
			return <LoadingPage />;
		}

		//Allow admin users to delete
		let onDelete;
		if (competition && authUser.isAdmin) {
			onDelete = () => deleteCompetition(competition._id);
		}

		//Set submit behaviour
		let onSubmit, redirectOnSubmit;
		if (competition) {
			onSubmit = (values: CompetitionFields) => updateCompetition(competition._id, values);
		} else {
			onSubmit = (values: CompetitionFields) => createCompetition(values);
			redirectOnSubmit = (competition: ICompetition) => `/competitions/${competition._id}`;
		}

		//Get Header
		const header = competition ? `Edit ${competition.name}` : "Add New Competition";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/competitions`}>Return to competition list</NavCard>
					<h1>{header}</h1>
					<BasicForm<CompetitionFields, ICompetition>
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType={"Competition"}
						onDelete={onDelete}
						onSubmit={onSubmit}
						redirectOnDelete={"/competitions"}
						redirectOnSubmit={redirectOnSubmit}
						showErrorSummary={false}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

export const CompetitionPage = connector(_CompetitionPage);
