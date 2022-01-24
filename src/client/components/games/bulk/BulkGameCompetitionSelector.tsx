//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { LoadingPage } from "~/client/components/global/LoadingPage";

//Actions
import { fetchAllCompetitions } from "~/client/actions/competitionActions";

//Interfaces & Enums
import { StoreState } from "~/client/reducers";
import { IGameBulkFormFields } from "~/models/Game";
import { FormFieldTypes, IField_Select, IFieldGroup } from "~/enum/FormFieldTypes";
import { convertRecordToSelectOptions } from "~/helpers/formHelper";
import { ICompetition } from "~/models/Competition";
import { BasicForm } from "~/client/components/forms/BasicForm";
interface FormFields extends Pick<IGameBulkFormFields, "_competition"> {}
interface IProps extends ConnectedProps<typeof connector> {}
interface IState {
	isLoadingDependents: boolean;
	options: IField_Select<FormFields>["options"];
}

//Redux
function mapStateToProps({ competitions }: StoreState) {
	return { competitions };
}
const mapDispatchToProps = { fetchAllCompetitions };
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
			options: convertRecordToSelectOptions<ICompetition>(
				competitions,
				"name",
				null,
				c => c.externalCompId != null
			)
		};
	}

	checkForGames(_competition: FormFields["_competition"]) {
		console.info(_competition);
	}

	render() {
		const { isLoadingDependents, options } = this.state;

		if (isLoadingDependents) {
			return <LoadingPage />;
		}

		const fieldGroups: IFieldGroup<FormFields>[] = [
			{ fields: [{ name: "_competition", type: FormFieldTypes.select, options }] }
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
