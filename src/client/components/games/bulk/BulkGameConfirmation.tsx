//Modules
import React, { Component, Fragment } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { BooleanSlider } from "~/client/components/forms/fields/BooleanSlider";
import { BasicForm } from "~/client/components/forms/BasicForm";

//Actions
import { fetchAllGames, bulkCreateGames } from "~/client/actions/gameActions";

//Helpers
const createGameKey = (i: number) => `game${i}`;

//Interfaces & Enums
import { StoreState } from "~/client/reducers";
import { IBulkGame, IGameBulkFormFields, IGameBulkFormFieldsConfirmation } from "~/models/Game";
import { FormFieldTypes, IFieldGroup } from "~/enum/FormFieldTypes";
enum BulkChangeAction {
	None,
	All,
	Invert
}

//Constants
interface IProps extends ConnectedProps<typeof connector> {
	_competition: string;
	gamesToConfirm: IBulkGame[];
}
interface IState {
	gameToggles: boolean[];
	isLoadingDependents: boolean;
	validationSchema: Yup.ObjectSchema;
}

//Redux
function mapStateToProps({ games, teams }: StoreState) {
	return { games, teams };
}
const mapDispatchToProps = { fetchAllGames, bulkCreateGames };
const connector = connect(mapStateToProps, mapDispatchToProps);

class _BulkGameConfirmation extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { fetchAllGames, games, gamesToConfirm } = props;

		let isLoadingDependents = false;
		if (!games) {
			fetchAllGames();
			isLoadingDependents = true;
		}

		//Get Validation Schema
		const validationSchema = Yup.object().shape({
			postAfterGame: Yup.boolean().label("Auto-post After Game?"),
			includeInWeeklyPost: Yup.boolean().label("Include in Weekly Post?")
		});

		//Get Game Toggles
		const gameToggles = gamesToConfirm.map(() => true);

		this.state = {
			gameToggles,
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
		const { gameToggles } = this.state;
		const fieldGroups: IFieldGroup<IGameBulkFormFieldsConfirmation>[] = [
			{
				label: "Social Post Settings",
				fields: [
					{ name: "postAfterGame", type: FormFieldTypes.boolean },
					{ name: "includeInWeeklyPost", type: FormFieldTypes.boolean }
				]
			}
		];

		if (gameToggles.filter(g => g).length === 0) {
			const error: IFieldGroup<IGameBulkFormFieldsConfirmation> = {
				render: () => (
					<span className="error" key="gameCountError">
						Please Select At Least One Game
					</span>
				)
			};
			fieldGroups.push(error);
		}

		return fieldGroups;
	}

	getInitialValues(): IGameBulkFormFieldsConfirmation {
		const { gamesToConfirm } = this.props;

		const gameValues: Record<string, boolean> = {};
		gamesToConfirm.forEach((g, i) => (gameValues[createGameKey(i)] = true));

		return {
			postAfterGame: true,
			includeInWeeklyPost: true
		};
	}

	changeSingleToggle(i: number) {
		const { gameToggles } = this.state;
		gameToggles[i] = !gameToggles[i];
		this.setState({ gameToggles });
	}

	bulkChangeToggles(action: BulkChangeAction) {
		const { gameToggles } = this.state;
		const newValues = gameToggles.map(value => {
			switch (action) {
				case BulkChangeAction.All:
					return true;
				case BulkChangeAction.None:
					return false;
				case BulkChangeAction.Invert:
					return !value;
			}
		});

		this.setState({ gameToggles: newValues });
	}

	async handleSubmit(values: IGameBulkFormFieldsConfirmation) {
		const { _competition, gamesToConfirm, bulkCreateGames } = this.props;
		const { gameToggles } = this.state;

		const results: IGameBulkFormFields = {
			...values,
			_competition,
			games: []
		};

		gameToggles.forEach((include: boolean, i: number) => {
			if (include) {
				results.games.push(gamesToConfirm[i]);
			}
		});

		if (results.games.length) {
			return await bulkCreateGames(results);
		} else {
			return false;
		}
	}

	renderBulkToggleButtons() {
		return (
			<div className="buttons" key="buttons">
				<button type="button" onClick={() => this.bulkChangeToggles(BulkChangeAction.All)}>
					Select All
				</button>
				<button type="button" onClick={() => this.bulkChangeToggles(BulkChangeAction.None)}>
					Select None
				</button>
				<button type="button" onClick={() => this.bulkChangeToggles(BulkChangeAction.Invert)}>
					Invert Selection
				</button>
			</div>
		);
	}

	renderIndividualGameToggles() {
		const { gamesToConfirm, teams } = this.props;
		const { gameToggles } = this.state;
		return gamesToConfirm.map((game, i) => {
			const isSelected = gameToggles[i];
			const name = `game-${i}`;

			//Get Label
			const home = teams![game._homeTeam].name.long;
			const away = teams![game._awayTeam].name.long;
			const labelArr = [game.date];
			if (game.round) {
				labelArr.push(`Round ${game.round}`);
			}
			labelArr.push(`${home} vs ${away}`);

			return (
				<div key={name} className="bulk-game-wrapper">
					<BooleanSlider name={name} value={isSelected} onChange={() => this.changeSingleToggle(i)} />
					<label className={isSelected ? undefined : "disabled"}>{labelArr.join(" - ")}</label>
				</div>
			);
		});
	}

	render() {
		const { isLoadingDependents, validationSchema } = this.state;

		if (isLoadingDependents) {
			return <LoadingPage />;
		}

		return (
			<Fragment>
				<div className="form-card card">
					{this.renderBulkToggleButtons()}
					{this.renderIndividualGameToggles()}
				</div>
				<BasicForm<IGameBulkFormFieldsConfirmation>
					onSubmit={values => this.handleSubmit(values)}
					fieldGroups={() => this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isInitialValid={true}
					redirectOnSubmit={"/games"}
					validationSchema={validationSchema}
				/>
			</Fragment>
		);
	}
}

export const BulkGameConfirmation = connector(_BulkGameConfirmation);
