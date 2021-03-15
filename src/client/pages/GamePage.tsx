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
import { fetchAllCompetitions } from "~/client/actions/competitionActions";
import { fetchAllGrounds } from "~/client/actions/groundActions";
import { fetchAllTeams } from "~/client/actions/teamActions";
import { createGame, deleteGame, fetchAllGames, updateGame } from "~/client/actions/gameActions";

//Helpers
import { dateToYMD, dateToHMS, validateHashtag } from "~/helpers/genericHelper";

//Interfaces & Enums
import { RouteComponentProps } from "react-router-dom";
import { StoreState } from "~/client/reducers";
import { IGame } from "~/models/Game";
import { FormFieldTypes, IFieldGroup, IFormikValues, SelectOption } from "~/enum/FormFieldTypes";
import { convertRecordToSelectOptions } from "~/helpers/formHelper";
import { ICompetition } from "~/models/Competition";
import { IGround } from "~/models/Ground";
import { ITeam } from "~/models/Team";
import { gameAsString } from "~/helpers/gameHelper";
interface IGameFormValues extends Partial<IGame> {
	time: string;
}

interface IProps extends ConnectedProps<typeof connector>, RouteComponentProps<any> {}
interface IState {
	options: {
		competitions: SelectOption[];
		grounds: SelectOption[];
		teams: SelectOption[];
	};
	isLoadingDependents: boolean;
	isNew: boolean;
	show404: boolean;
	game?: IGame;
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ competitions, grounds, games, teams }: StoreState) {
	return { competitions, grounds, games, teams };
}
const mapDispatchToProps = {
	fetchAllGrounds,
	fetchAllGames,
	createGame,
	updateGame,
	deleteGame,
	fetchAllTeams,
	fetchAllCompetitions
};
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
class _GamePage extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const {
			fetchAllGrounds,
			fetchAllGames,
			fetchAllTeams,
			fetchAllCompetitions,
			competitions,
			grounds,
			match,
			games,
			teams
		} = props;

		//Ensure we have dependencies
		let isLoadingDependents = false;
		if (!games) {
			fetchAllGames();
			isLoadingDependents = true;
		}
		if (!competitions) {
			fetchAllCompetitions();
			isLoadingDependents = true;
		}
		if (!grounds) {
			fetchAllGrounds();
			isLoadingDependents = true;
		}
		if (!teams) {
			fetchAllTeams();
			isLoadingDependents = true;
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
			_homeTeam: Yup.string().required().label("Home Team"),
			_awayTeam: Yup.string().required().label("Away Team"), //TODO ensure home !== away
			_ground: Yup.string().label("Ground"),
			_competition: Yup.string().required().label("Competition"),
			date: Yup.string().required().label("Date"),
			time: Yup.string().required().label("Time"),
			round: Yup.string().label("Round"),
			customHashtag: Yup.string().test(hashtagTest).label("Hashtag"),
			overwriteHashtag: Yup.boolean().label("Overwrite Default?"),
			isOnTv: Yup.boolean().label("Televised?"),
			image: Yup.string().label("Custom Logo"),

			postAfterGame: Yup.boolean().label("Autopost After Game?"),
			includeInWeeklyPost: Yup.boolean().label("Include in Weekly Post?")
		});

		this.state = {
			options: {
				competitions: [],
				grounds: [],
				teams: []
			},
			isLoadingDependents,
			isNew,
			show404: false,
			validationSchema
		};
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> | null {
		const { match, competitions, grounds, games, teams } = nextProps;
		const newState: Partial<IState> = {};

		//First, we check for the required data
		if (!games || !grounds || !teams || !competitions) {
			return null;
		}
		newState.isLoadingDependents = false;

		//Get select options
		const competitionOptions = convertRecordToSelectOptions<ICompetition>(competitions, "name");

		const groundOptions = convertRecordToSelectOptions<IGround>(grounds, ({ name, city }) => `${name}, ${city}`);
		groundOptions.unshift({ label: "Home Team's Ground", value: "auto" });

		const teamOptions = convertRecordToSelectOptions<ITeam>(
			teams,
			({ name }) => name.long,
			team => `${team.isFavourite ? "A" : "B"}${team.name.long}`
		);
		newState.options = {
			competitions: competitionOptions,
			grounds: groundOptions,
			teams: teamOptions
		};

		//For the "new" page, we don't need to set a game object
		if (!prevState.isNew) {
			//Pull the game from the list, or set it to false if we can't find a match
			const game = games[match.params._id];
			if (game) {
				newState.game = game;
			} else {
				newState.show404 = true;
			}
		}

		return newState;
	}

	getInitialValues(): IFormikValues {
		const { game } = this.state;

		const defaultValues: IGameFormValues = {
			_homeTeam: "",
			_awayTeam: "",
			_ground: "auto",
			_competition: "",
			date: "",
			time: "",
			round: "",
			customHashtag: "",
			overwriteHashtag: false,
			isOnTv: false,
			image: "",
			postAfterGame: true,
			includeInWeeklyPost: true
		};

		if (game) {
			//Set _ground back to empty string
			defaultValues._ground = "";
			return _.mapValues(defaultValues, (defaultValue, field: keyof IGameFormValues) => {
				switch (field) {
					case "date":
						return dateToYMD(new Date(game.date));
					case "time":
						return dateToHMS(new Date(game.date));
					default:
						return game[field] ?? defaultValue;
				}
			});
		}

		return defaultValues;
	}

	getFieldGroups(values: IFormikValues): IFieldGroup[] {
		const { games, teams } = this.props;
		const { game, options } = this.state;

		//Create image dependency check
		let dependentCheck;
		if (games && teams) {
			dependentCheck = (filename: string) => {
				const dependents = Object.values(games)
					//If we have a game object, exclude it from this check
					.filter(({ _id }) => !game || _id !== game._id)
					//Look for any games using this image
					.filter(({ image }) => image === filename)
					//Pull off the game name
					.map(game => gameAsString(game, teams));
				return {
					dataType: "Games",
					dependents
				};
			};
		}

		return [
			{
				label: "Basic Game Data",
				fields: [
					{ name: "_homeTeam", type: FormFieldTypes.select, options: options.teams, fastField: false },
					{ name: "_awayTeam", type: FormFieldTypes.select, options: options.teams, fastField: false },
					{ name: "_ground", type: FormFieldTypes.select, options: options.grounds },
					{ name: "_competition", type: FormFieldTypes.select, options: options.competitions },
					{ name: "date", type: FormFieldTypes.date },
					{ name: "time", type: FormFieldTypes.time },
					{ name: "round", type: FormFieldTypes.text },
					{ name: "isOnTv", type: FormFieldTypes.boolean },
					{
						name: "image",
						type: FormFieldTypes.image,
						path: "images/games/",
						sizeForSelector: "thumbnail",
						dependentCheck,
						resize: {
							thumbnail: { width: 200 }
						}
					}
				]
			},
			{
				label: "Custom Hashtag",
				fields: [
					{ name: "customHashtag", type: FormFieldTypes.text, fastField: false },
					{
						name: "overwriteHashtag",
						type: FormFieldTypes.boolean,
						hide: !values.customHashtag,
						fastField: false
					}
				]
			},
			{
				label: "Social Media Posting",
				fields: [
					{ name: "postAfterGame", type: FormFieldTypes.boolean },
					{ name: "includeInWeeklyPost", type: FormFieldTypes.boolean }
				]
			}
		];
	}

	alterValuesBeforeSubmit(values: IFormikValues) {
		values.date = `${values.date} ${values.time}`;
		delete values.time;
	}

	render() {
		const { createGame, updateGame, deleteGame, teams } = this.props;
		const { isLoadingDependents, isNew, game, show404, validationSchema } = this.state;

		//If we've explicitly set the user to false, show a 404 page
		if (show404) {
			return <NotFoundPage message="Game not found" />;
		}

		//Otherwise if game is undefined, show a loading spinner
		if (isLoadingDependents) {
			return <LoadingPage />;
		}

		//Allow admin users to delete
		let onDelete;
		if (game) {
			onDelete = () => deleteGame(game._id);
		}

		//Set submit behaviour
		let onSubmit, redirectOnSubmit;
		if (game) {
			onSubmit = (values: IFormikValues) => updateGame(game._id, values);
		} else {
			onSubmit = (values: IFormikValues) => createGame(values);
			redirectOnSubmit = (values: IFormikValues) => `/games/${values._id}`;
		}

		//Get Header
		const header = game ? `Edit ${gameAsString(game, teams!)}` : "Add New Game";
		return (
			<section className="admin-page user-page">
				<HelmetBuilder title={header} />
				<div className="container">
					<NavCard to={`/games`}>Return to game list</NavCard>
					<h1>{header}</h1>
					<BasicForm
						alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
						fieldGroups={values => this.getFieldGroups(values)}
						initialValues={this.getInitialValues()}
						isNew={isNew}
						itemType={"Game"}
						onDelete={onDelete}
						onSubmit={onSubmit}
						redirectOnDelete={"/games"}
						redirectOnSubmit={redirectOnSubmit}
						showErrorSummary={false}
						validationSchema={validationSchema}
					/>
				</div>
			</section>
		);
	}
}

export const GamePage = connector(_GamePage);
