//Modules
import React, { Component } from "react";
import * as Yup from "yup";

//Components
import { BasicSettingsPage } from "~/client/pages/settings/BasicSettingsPage";
import { TwitterValidator } from "~/client/components/social/TwitterValidator";

//Interfaces & Enums
import { ISettings } from "~/models/Settings";
const settingsGroup: keyof ISettings = "twitterApp";
type FormFields = ISettings[typeof settingsGroup];
import { FormFieldTypes, IFieldGroup } from "~/enum/FormFieldTypes";

//Component
export class TwitterAppSettings extends Component {
	renderFieldGroups(values: FormFields): IFieldGroup<FormFields>[] {
		return [
			{
				render: () => (
					<p className="error" key="error">
						<strong>Warning:</strong> Changing these values may invalidate any existing social profiles.
						Proceed with caution
					</p>
				)
			},
			{
				fields: [
					{ name: "consumer_key", type: FormFieldTypes.text },
					{ name: "consumer_secret", type: FormFieldTypes.text },
					{ name: "access_token", type: FormFieldTypes.text },
					{ name: "access_token_secret", type: FormFieldTypes.text }
				]
			},
			{
				render: () => <TwitterValidator values={values} key="validator" />
			}
		];
	}

	render() {
		//Create Validation Schema
		const validationSchema = Yup.object().shape({
			consumer_key: Yup.string().required().label("Consumer Key"),
			consumer_secret: Yup.string().required().label("Consumer Key Secret"),
			access_token: Yup.string().required().label("Default Access Token"),
			access_token_secret: Yup.string().required().label("Default Access Token Secret")
		});

		return (
			<BasicSettingsPage<FormFields>
				fieldGroups={values => this.renderFieldGroups(values)}
				settingGroup={settingsGroup}
				validationSchema={validationSchema}
			/>
		);
	}
}
