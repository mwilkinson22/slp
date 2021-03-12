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
import { fetchAllGrounds } from "~/client/actions/groundActions";
import { createTeam, deleteTeam, fetchAllTeams, updateTeam } from "~/client/actions/teamActions";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IUser } from "~/models/User";
import { ITeam } from "~/models/Team";
import { FormFieldTypes, IFieldGroup, IFormikValues, SelectOption } from "~/enum/FormFieldTypes";
import { convertRecordToSelectOptions } from "~/helpers/formHelper";
import { IGround } from "~/models/Ground";

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	groundOptions: SelectOption[];
	isNew: boolean;
	show404: boolean;
	team?: ITeam;
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ config, grounds, teams }: StoreState) {
	const { authUser } = config;
	return { authUser: authUser as IUser, grounds, teams };
}
const mapDispatchToProps = { fetchAllGrounds, fetchAllTeams, createTeam, updateTeam, deleteTeam };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _TeamPage extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { fetchAllGrounds, fetchAllTeams, grounds, match, teams } = props;

		//Ensure we have teams list
		if (!teams) {
			fetchAllTeams();
		}

		//Ensure we have grounds list
		if (!grounds) {
			fetchAllGrounds();
		}

		//Work out if it's a new user form
		const isNew = !match.params._id;

		//Create a validation schema
		const validationSchema = Yup.object().shape({
			name: Yup.object().shape({
				short: Yup.string().required().label("Short Name"),
				long: Yup.string().required().label("Long Name")
			}),
			nickname: Yup.string().required().label("Nickname"),
			hashtag: Yup.string().required().label("Hashtag"),
			_ground: Yup.string().required().label("Home Ground"),
			colours: Yup.object().shape({
				main: Yup.string().required().label("Main"),
				trim: Yup.string().required().label("Trim"),
				text: Yup.string().required().label("Text")
			}),
			image: Yup.string().required().label("Badge")
		});

		this.state = { groundOptions: [], isNew, show404: false, validationSchema };
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> | null {
		const { match, grounds, teams } = nextProps;
		const newState: Partial<IState> = {};

		//First, we check for the teams list
		if (!teams || !grounds) {
			return null;
		}

		//Convert ground list to options
		newState.groundOptions = convertRecordToSelectOptions<IGround>(grounds, ({ name, city }) => `${name}, ${city}`);

		//For the "new" page, we don't need to set a team object
		if (!prevState.isNew) {
			//Pull the team from the list, or set it to false if we can't find a match
			const team = teams[match.params._id];
			if (team) {
				newState.team = team;
			} else {
				newState.show404 = true;
			}
		}

		return newState;
	}

	getInitialValues(): IFormikValues {
		const { team } = this.state;

		const defaultValues: Partial<ITeam> = {
			name: {
				short: "",
				long: ""
			},
			nickname: "",
			hashtag: "",
			colours: {
				main: "#880000",
				text: "#FFFFFF",
				trim: "#220000"
			},
			_ground: "",
			image: ""
		};

		if (team) {
			return _.mapValues(defaultValues, (defaultValue, field: keyof ITeam) => {
				return team[field] ?? defaultValue;
			});
		}

		return defaultValues;
	}

	getFieldGroups(): IFieldGroup[] {
		const { teams } = this.props;
		const { groundOptions, team } = this.state;

		//Create image dependency check
		let dependentCheck;
		if (teams) {
			dependentCheck = (filename: string) => {
				const dependents = Object.values(teams)
					//If we have a team object, exclude it from this check
					.filter(({ _id }) => !team || _id !== team._id)
					//Look for any teams using this image
					.filter(({ image }) => image === filename)
					//Pull off the team name
					.map(({ name }) => name.long);
				return {
					dataType: "Teams",
					dependents
				};
			};
		}

		return [
			{
				fields: [
					{ name: "name.short", type: FormFieldTypes.text, placeholder: "Wigan" },
					{ name: "name.long", type: FormFieldTypes.text, placeholder: "Wigan Warriors" },
					{ name: "nickname", type: FormFieldTypes.text, placeholder: "the Grubs" },
					{ name: "hashtag", type: FormFieldTypes.text, placeholder: "Wig" },
					{ name: "_ground", type: FormFieldTypes.select, options: groundOptions }
				]
			},
			{
				label: "Colours",
				fields: [
					{ name: "colours.main", type: FormFieldTypes.colour },
					{ name: "colours.trim", type: FormFieldTypes.colour },
					{ name: "colours.text", type: FormFieldTypes.colour }
				]
			},
			{
				label: "Images",
				fields: [
					{
						name: "image",
						type: FormFieldTypes.image,
						path: "images/teams/",
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
		const { authUser, createTeam, updateTeam, deleteTeam } = this.props;
		const { isNew, team, show404, validationSchema } = this.state;

		//If we've explicitly set the user to false, show a 404 page
		if (show404) {
			return <NotFoundPage message="Team not found" />;
		}

		//Otherwise if team is undefined, show a loading spinner
		if (!isNew && !team) {
			return <LoadingPage />;
		}

		//Allow admin users to delete
		let onDelete;
		if (team && authUser.isAdmin) {
			onDelete = () => deleteTeam(team._id);
		}

		//Set submit behaviour
		let onSubmit, redirectOnSubmit;
		if (team) {
			onSubmit = (values: IFormikValues) => updateTeam(team._id, values);
		} else {
			onSubmit = (values: IFormikValues) => createTeam(values);
			redirectOnSubmit = (values: IFormikValues) => `/teams/${values._id}`;
		}

		//Get Header
		const header = team ? `Edit ${team.name.short}` : "Add New Team";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/teams`}>Return to team list</NavCard>
					<h1>{header}</h1>
					<BasicForm
						fieldGroups={this.getFieldGroups()}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType={"Team"}
						onDelete={onDelete}
						onSubmit={onSubmit}
						redirectOnDelete={"/teams"}
						redirectOnSubmit={redirectOnSubmit}
						showErrorSummary={false}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

export const TeamPage = connector(_TeamPage);