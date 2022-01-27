//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { BasicForm } from "~/client/components/forms/BasicForm";

//Actions
import { fetchAllTeams } from "~/client/actions/teamActions";

//Helpers
import { convertRecordToSelectOptions } from "~/helpers/formHelper";

//Constants
const skipTeamOption: SelectOption = { label: "-Skip Games For This Team-", value: "skip" };

//Interfaces & Enums
import { StoreState } from "~/client/reducers";
import { IBulkGame } from "~/models/Game";
import { FormFieldTypes, IField_Select, IFieldAny, IFieldGroup, SelectOption } from "~/enum/FormFieldTypes";
import { ITeam } from "~/models/Team";

interface FormFields extends Record<string, string> {}

interface IProps extends ConnectedProps<typeof connector> {
	onComplete: (games: IBulkGame[]) => void;
	games: IBulkGame[];
}
interface IState {
	externalTeams: string[];
	isLoadingDependents: boolean;
	options: IField_Select<FormFields>["options"];
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ teams }: StoreState) {
	return { teams };
}
const mapDispatchToProps = { fetchAllTeams };
const connector = connect(mapStateToProps, mapDispatchToProps);

class _BulkGameTeamSelector extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { fetchAllTeams, teams, games } = props;

		let isLoadingDependents = false;
		if (!teams) {
			fetchAllTeams();
			isLoadingDependents = true;
		}

		//Get all teams from external games
		const externalTeams: string[] = [];
		games.forEach(({ _homeTeam, _awayTeam }) => {
			if (!externalTeams.includes(_homeTeam)) {
				externalTeams.push(_homeTeam);
			}
			if (!externalTeams.includes(_awayTeam)) {
				externalTeams.push(_awayTeam);
			}
		});
		externalTeams.sort();

		//Get Validation Schema
		const rawValidationSchema: Record<string, Yup.Schema<string>> = {};
		externalTeams.forEach(team => (rawValidationSchema[team] = Yup.string().label(team).required()));
		const validationSchema = Yup.object().shape(rawValidationSchema);

		this.state = {
			externalTeams,
			isLoadingDependents,
			options: [],
			validationSchema
		};
	}

	static getDerivedStateFromProps(nextProps: IProps): Partial<IState> | null {
		const { teams } = nextProps;

		if (!teams) {
			return null;
		}
		const options = convertRecordToSelectOptions<ITeam>(teams, t => t.name.long, { groupByFavourite: false });
		options.unshift(skipTeamOption);
		return {
			isLoadingDependents: false,
			options
		};
	}

	getFieldGroups(): IFieldGroup<FormFields>[] {
		const { externalTeams, options } = this.state;
		const fields: IFieldAny<FormFields>[] = externalTeams.map(team => ({
			name: team,
			type: FormFieldTypes.select,
			options
		}));
		return [{ fields, label: "Confirm Teams" }];
	}

	getInitialValues() {
		const { teams } = this.props;
		const { externalTeams } = this.state;

		//Convert our database teams to simplified uppercase string fields
		const teamNames = _.map(teams, team => ({
			_id: team._id,
			names: [
				team.name.long.toUpperCase(),
				team.name.short.toUpperCase(),
				team.nickname.toUpperCase().replace(/^THE /, "")
			]
		}));

		const values: FormFields = {};
		externalTeams.forEach(team => {
			let value = "";

			const matchedTeams = teamNames.filter(({ names }) => names.includes(team.toUpperCase()));
			if (matchedTeams.length === 1) {
				value = matchedTeams[0]._id;
			}

			values[team] = value;
		});
		return values;
	}

	returnGames(values: FormFields) {
		const { games, onComplete } = this.props;

		const gamesToReturn: IBulkGame[] = games
			//First, map in the teams
			.map(game => {
				game._homeTeam = values[game._homeTeam];
				game._awayTeam = values[game._awayTeam];
				return game;
			})
			//Then remove the skips
			.filter(game => game._homeTeam !== skipTeamOption.value && game._awayTeam !== skipTeamOption.value);
		onComplete(gamesToReturn);
	}

	render() {
		const { isLoadingDependents, validationSchema } = this.state;

		if (isLoadingDependents) {
			return <LoadingPage />;
		}

		return (
			<BasicForm<FormFields>
				onSubmit={values => this.returnGames(values)}
				fieldGroups={this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isInitialValid={true}
				includeResetButton={false}
				submitButtonText="Confirm Teams"
				validationSchema={validationSchema}
			/>
		);
	}
}

export const BulkGameTeamSelector = connector(_BulkGameTeamSelector);
