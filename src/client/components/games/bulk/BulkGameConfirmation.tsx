//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { BasicForm } from "~/client/components/forms/BasicForm";

//Actions
import { fetchAllGames } from "~/client/actions/gameActions";

//Helpers
const createGameKey = (i: number) => `game${i}`;

//Interfaces & Enums
import { StoreState } from "~/client/reducers";
import { IBulkGame, IGameBulkFormFields, IGameBulkFormFieldsConfirmation } from "~/models/Game";
import { FormFieldTypes, IFieldAny, IFieldGroup } from "~/enum/FormFieldTypes";
import { FormikProps } from "formik";
enum BulkChangeAction {
	None,
	All,
	Invert
}

//Constants
interface IProps extends ConnectedProps<typeof connector> {
	_competition: string;
	onComplete: (data: IGameBulkFormFields) => void;
	gamesToConfirm: IBulkGame[];
}
interface IState {
	isLoadingDependents: boolean;
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ games, teams }: StoreState) {
	return { games, teams };
}
const mapDispatchToProps = { fetchAllGames };
const connector = connect(mapStateToProps, mapDispatchToProps);

class _BulkGameConfirmation extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { fetchAllGames, games, gamesToConfirm, teams } = props;

		let isLoadingDependents = false;
		if (!games) {
			fetchAllGames();
			isLoadingDependents = true;
		}

		//Get Validation Schema
		const gameValidation: Record<string, Yup.BooleanSchema> = {};
		gamesToConfirm.forEach((g, i) => {
			const home = teams![g._homeTeam].name.long;
			const away = teams![g._awayTeam].name.long;
			const labelArr = [g.date];
			if (g.round) {
				labelArr.push(`Round ${g.round}`);
			}
			labelArr.push(`${home} vs ${away}`);
			gameValidation[createGameKey(i)] = Yup.boolean().label(labelArr.join(" - "));
		});

		const validationSchema = Yup.object().shape({
			games: Yup.object().shape(gameValidation),
			_competition: Yup.string().label("Competition"),
			postAfterGame: Yup.boolean().label("Autopost After Game?"),
			includeInWeeklyPost: Yup.boolean().label("Include in Weekly Post?")
		});

		this.state = {
			isLoadingDependents,
			validationSchema
		};
	}

	static getDerivedStateFromProps(nextProps: IProps, prevState: IState): Partial<IState> | null {
		const { games } = nextProps;

		if (prevState.isLoadingDependents && games) {
			return { isLoadingDependents: false };
		}
		return null;
	}

	getFieldGroups(): IFieldGroup<IGameBulkFormFieldsConfirmation>[] {
		const { gamesToConfirm } = this.props;

		const fields: IFieldAny<IGameBulkFormFieldsConfirmation>[] = gamesToConfirm.map((game, i) => ({
			name: `games.${createGameKey(i)}`,
			type: FormFieldTypes.boolean
		}));

		return [
			{
				label: "Confirm Games",
				render: (values, formik) => {
					return (
						<div className="buttons" key="buttons">
							<button
								type="button"
								onClick={() => this.bulkChangeToggles(BulkChangeAction.All, values.games, formik)}
							>
								Select All
							</button>
							<button
								type="button"
								onClick={() => this.bulkChangeToggles(BulkChangeAction.None, values.games, formik)}
							>
								Select None
							</button>
							<button
								type="button"
								onClick={() => this.bulkChangeToggles(BulkChangeAction.Invert, values.games, formik)}
							>
								Invert Selection
							</button>
						</div>
					);
				}
			},
			{ fields },
			{
				label: "Social Post Settings",
				fields: [
					{ name: "postAfterGame", type: FormFieldTypes.boolean },
					{ name: "includeInWeeklyPost", type: FormFieldTypes.boolean }
				]
			}
		];
	}

	bulkChangeToggles(
		action: BulkChangeAction,
		values: Record<string, boolean>,
		formik: FormikProps<IGameBulkFormFieldsConfirmation>
	) {
		const newValues: Record<string, boolean> = {};
		for (const i in values) {
			let value;
			switch (action) {
				case BulkChangeAction.All:
					value = true;
					break;
				case BulkChangeAction.None:
					value = false;
					break;
				case BulkChangeAction.Invert:
					value = !values[i];
					break;
			}
			newValues[i] = value;
		}

		formik.setFieldValue("games", newValues);
	}

	getInitialValues(): IGameBulkFormFieldsConfirmation {
		const { _competition, gamesToConfirm } = this.props;

		const gameValues: Record<string, boolean> = {};
		gamesToConfirm.forEach((g, i) => (gameValues[createGameKey(i)] = true));

		return {
			_competition,
			postAfterGame: true,
			includeInWeeklyPost: true,
			games: gameValues
		};
	}

	handleValues(values: IGameBulkFormFieldsConfirmation) {
		const { gamesToConfirm, onComplete } = this.props;

		const results: IGameBulkFormFields = {
			...values,
			games: []
		};

		Object.values(values.games).forEach((game, i) => {
			if (values.games[createGameKey(i)]) {
				results.games.push(gamesToConfirm[i]);
			}
		});

		onComplete(results);
	}

	render() {
		const { isLoadingDependents, validationSchema } = this.state;

		if (isLoadingDependents) {
			return <LoadingPage />;
		}

		return (
			<BasicForm<IGameBulkFormFieldsConfirmation>
				onSubmit={values => this.handleValues(values)}
				fieldGroups={() => this.getFieldGroups()}
				initialValues={this.getInitialValues()}
				isNew={true}
				itemType="Games"
				isInitialValid={true}
				validationSchema={validationSchema}
			/>
		);
	}
}

export const BulkGameConfirmation = connector(_BulkGameConfirmation);
