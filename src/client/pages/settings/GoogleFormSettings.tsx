//Modules
import React from "react";
import * as Yup from "yup";

//Components
import { BasicSettingsPage } from "~/client/pages/settings/BasicSettingsPage";

//Interfaces & Enums
import { ISettings } from "~/models/Settings";
import { FormFieldTypes, IFieldGroup } from "~/enum/FormFieldTypes";

//Component
export function GoogleFormSettings() {
	const settingsGroup: keyof ISettings = "googleForm";
	type FormFields = ISettings[typeof settingsGroup];

	//Get Field Groups
	const fieldGroups: IFieldGroup<FormFields>[] = [
		{
			fields: [{ name: "link", type: FormFieldTypes.text }]
		}
	];

	//Create Validation Schema
	const validationSchema = Yup.object().shape({
		link: Yup.string().label("Link")
	});

	return (
		<BasicSettingsPage<FormFields>
			fieldGroups={fieldGroups}
			settingGroup={settingsGroup}
			validationSchema={validationSchema}
		/>
	);
}
