//Modules
import React from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Components
import { BasicSettingsPage } from "~/client/pages/settings/BasicSettingsPage";

//Actions
import { previewWeeklyPostImage } from "~/client/actions/gameActions";

//Interfaces & Enums
import { ISettings } from "~/models/Settings";
import { FormFieldTypes, IFieldGroup } from "~/enum/FormFieldTypes";
import { ServerContentPreview } from "~/client/components/forms/ServerContentPreview";
import { ConnectedProps } from "react-redux";

//Redux
const connector = connect(null, { previewWeeklyPostImage });

//Component
function _WeeklyPostSettings(props: ConnectedProps<typeof connector>) {
	const settingsGroup: keyof ISettings = "weeklyPost";
	type FormFields = ISettings[typeof settingsGroup];

	//Get Field Groups
	const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((label, value) => ({
		label,
		value: value.toString()
	}));
	//Get Field Groups
	const teamNameLabels = ["Short", "Long", "Nickname"].map(label => ({ label, value: label.toLowerCase() }));

	const fieldGroups: IFieldGroup<FormFields>[] = [
		{
			fields: [{ name: "defaultTweetText", type: FormFieldTypes.tweet, calculateLength: false }]
		},
		{
			render: () => (
				<p key="disclaimer" className="full-span">
					<em>
						The Google Form link and as many corresponding hashtags as possible will be added automatically
					</em>
					<br />
					<br />
				</p>
			)
		},
		{
			fields: [
				{ name: "teamName", type: FormFieldTypes.radio, options: teamNameLabels },
				{ name: "postDate", type: FormFieldTypes.select, options: days },
				{ name: "postTime", type: FormFieldTypes.time, step: 900 },
				{ name: "defaultImageText", type: FormFieldTypes.textarea }
			]
		},
		{
			render: (values: FormFields) => (
				<ServerContentPreview
					key="image-preview"
					getData={() => props.previewWeeklyPostImage(null, values)}
					renderContent={"image"}
				/>
			)
		}
	];

	//Create Validation Schema
	const validationSchema = Yup.object().shape({
		defaultImageText: Yup.string().required().label("Image Text"),
		defaultTweetText: Yup.string().required().label("Default Tweet Text"),
		teamName: Yup.string().required().label("Team Name Format"),
		postDate: Yup.string().required().label("Scheduled Post Date"),
		postTime: Yup.string()
			.required()
			.test({
				name: "15-mins",
				message: "Must be :00, :15, :30 or :45",
				test: value => {
					if (value) {
						return ["00", "15", "30", "45"].includes(value.split(":")[1]);
					}
					return true;
				}
			})
			.label("Scheduled Post Time")
	});

	return (
		<BasicSettingsPage<FormFields>
			fieldGroups={fieldGroups}
			settingGroup={settingsGroup}
			validationSchema={validationSchema}
		/>
	);
}

export const WeeklyPostSettings = connector(_WeeklyPostSettings);
