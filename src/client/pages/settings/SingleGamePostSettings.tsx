//Modules
import React from "react";
import * as Yup from "yup";

//Components
import { BasicSettingsPage } from "~/client/pages/settings/BasicSettingsPage";

//Interfaces & Enums
import { ISettings } from "~/models/Settings";
import { FormFieldTypes, IFieldGroup } from "~/enum/FormFieldTypes";

//Component
export function SingleGamePostSettings() {
	type FormFields = ISettings["singleGamePost"];

	//Get Field Groups
	const teamNameLabels = ["Short", "Long", "Nickname"].map(label => ({ label, value: label.toLowerCase() }));
	const fieldGroups: IFieldGroup<FormFields>[] = [
		{
			fields: [
				{ name: "defaultTweetText", type: FormFieldTypes.textarea },
				{ name: "defaultImageText", type: FormFieldTypes.textarea },
				{ name: "teamName", type: FormFieldTypes.radio, options: teamNameLabels }
			]
		}
	];

	//Create Validation Schema
	const validationSchema = Yup.object().shape({
		defaultTweetText: Yup.string().required().label("Default Tweet Text"),
		defaultImageText: Yup.string().required().label("Default Image Text"),
		teamName: Yup.string().required().label("Team Name To Use")
	});

	return (
		<BasicSettingsPage<FormFields>
			fieldGroups={fieldGroups}
			settingGroup={"singleGamePost"}
			validationSchema={validationSchema}
		/>
	);
}
