//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";
import { BasicForm } from "~/client/components/forms/BasicForm";

//Actions
import { fetchAllCompetitions, fetchExternalGames } from "~/client/actions/competitionActions";

//Helpers
import { convertRecordToSelectOptions } from "~/helpers/formHelper";

//Interfaces & Enums
import { StoreState } from "~/client/reducers";
import { IBulkGame, IGameBulkFormFields } from "~/models/Game";
import { FormFieldTypes, IField_Select, IFieldGroup } from "~/enum/FormFieldTypes";
import { ICompetition } from "~/models/Competition";

interface FormFields extends Pick<IGameBulkFormFields, "_competition"> {}

interface IProps extends ConnectedProps<typeof connector> {
	onStartCheck: (_competition: string) => void;
	onComplete: (rawGames: IBulkGame[]) => void;
}
interface IState {
	isLoadingDependents: boolean;
	options: IField_Select<FormFields>["options"];
}

//Redux
function mapStateToProps({ competitions }: StoreState) {
	return { competitions };
}
const mapDispatchToProps = { fetchAllCompetitions, fetchExternalGames };
const connector = connect(mapStateToProps, mapDispatchToProps);

class _BulkGameCompetitionSelector extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		const { fetchAllCompetitions, competitions } = props;

		let isLoadingDependents = false;
		if (!competitions) {
			fetchAllCompetitions();
			isLoadingDependents = true;
		}

		this.state = {
			isLoadingDependents,
			options: []
		};
	}

	static getDerivedStateFromProps(nextProps: IProps): Partial<IState> | null {
		const { competitions } = nextProps;

		if (!competitions) {
			return null;
		}
		return {
			isLoadingDependents: false,
			options: convertRecordToSelectOptions<ICompetition>(competitions, "name", {
				filter: c => c.externalCompId != null
			})
		};
	}

	async checkForGames(_competition: FormFields["_competition"]) {
		const { fetchExternalGames, onComplete, onStartCheck } = this.props;
		onStartCheck(_competition);
		const rawGames = await fetchExternalGames(_competition);
		if (rawGames) {
			onComplete(rawGames);
		}
	}

	render() {
		const { isLoadingDependents, options } = this.state;

		if (isLoadingDependents) {
			return <LoadingPage />;
		}

		const fieldGroups: IFieldGroup<FormFields>[] = [
			{
				fields: [
					{
						name: "_competition",
						type: FormFieldTypes.select,
						options,
						isClearable: false,
						isSearchable: true
					}
				]
			}
		];
		const validationSchema = Yup.object().shape({ _competition: Yup.string().label("Competition") });

		return (
			<BasicForm<FormFields>
				onSubmit={({ _competition }) => this.checkForGames(_competition)}
				fieldGroups={fieldGroups}
				initialValues={{ _competition: "" }}
				includeResetButton={false}
				submitButtonText="Check For Games"
				validationSchema={validationSchema}
			/>
		);
	}
}

export const BulkGameCompetitionSelector = connector(_BulkGameCompetitionSelector);
