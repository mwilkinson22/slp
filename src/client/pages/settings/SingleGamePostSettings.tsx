//Modules
import _ from "lodash";
import React from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { BasicSettingsPage } from "~/client/pages/settings/BasicSettingsPage";
import { ServerContentPreview } from "~/client/components/forms/ServerContentPreview";

//Interfaces & Enums
import { ISettings } from "~/models/Settings";
import { FormFieldTypes, IFieldGroup } from "~/enum/FormFieldTypes";
import { getSingleGamePostText, previewSingleGameImage } from "~/client/actions/gameActions";
import { gameVariableMap } from "~/helpers/gameHelper";

//Redux
const connector = connect(null, { getSingleGamePostText, previewSingleGameImage });

//Component
function _SingleGamePostSettings(props: ConnectedProps<typeof connector>) {
	type FormFields = ISettings["singleGamePost"];

	//Get Field Groups
	const teamNameLabels = ["Short", "Long", "Nickname"].map(label => ({ label, value: label.toLowerCase() }));
	const fieldGroups: IFieldGroup<FormFields>[] = [
		{
			label: "Scheduled Post Settings",
			fields: [
				{ name: "gameDelay", type: FormFieldTypes.number },
				{ name: "tvDelay", type: FormFieldTypes.number },
				{ name: "retweetDelay", type: FormFieldTypes.number }
			]
		},
		{
			render: () => <hr key="divider-1" />
		},
		{
			label: "Text Settings",
			render: () => {
				const variablePairs = [];
				for (const variable in gameVariableMap) {
					variablePairs.push(
						<label key={`${variable}-label`}>%{variable}%</label>,
						<span key={`${variable}-desc`}>{gameVariableMap[variable].description}</span>
					);
				}

				return (
					<div className="single-post-variables full-span" key="variable-map">
						<h6>Variables</h6>
						<p>
							The following variables can be used in the template, and will be automatically populated for
							each game.
						</p>
						<p>
							If the %ground% variable is used and the game has no ground, then &apos;Backup Ground
							Text&apos; will be used
						</p>
						<div className="map">{variablePairs}</div>
					</div>
				);
			}
		},
		{
			fields: [
				{
					name: "defaultTweetText",
					type: FormFieldTypes.tweet,
					calculateLength: false,
					variables: _.map(gameVariableMap, ({ description }, value) => ({
						label: description,
						value: `%${value}%`
					}))
				},
				{ name: "backupGroundText", type: FormFieldTypes.text }
			]
		},
		{
			render: (values: FormFields) => (
				<ServerContentPreview
					key="text-preview"
					getData={() => props.getSingleGamePostText(null, values)}
					renderContent={"textarea"}
				/>
			)
		},
		{
			render: () => <hr key="divider-2" />
		},
		{
			label: "Image Settings",
			fields: [
				{ name: "defaultImageText", type: FormFieldTypes.textarea },
				{ name: "teamName", type: FormFieldTypes.radio, options: teamNameLabels }
			]
		},
		{
			render: (values: FormFields) => (
				<ServerContentPreview
					key="image-preview"
					getData={() => props.previewSingleGameImage(null, values)}
					renderContent={"image"}
				/>
			)
		}
	];

	//Create Validation Schema
	const validationSchema = Yup.object().shape({
		defaultTweetText: Yup.string().required().label("Default Text"),
		defaultImageText: Yup.string().required().label("Image Text"),
		backupGroundText: Yup.string().required().label("Backup Ground Text"),
		teamName: Yup.string().required().label("Team Name Format"),
		gameDelay: Yup.string().required().label("Post (x) minutes after kick-off"),
		tvDelay: Yup.string().required().label("Add (x) extra minutes for tv games"),
		retweetDelay: Yup.string().required().label("Retweet (x) minutes after posting")
	});

	return (
		<BasicSettingsPage<FormFields>
			fieldGroups={fieldGroups}
			settingGroup={"singleGamePost"}
			validationSchema={validationSchema}
		/>
	);
}
export const SingleGamePostSettings = connector(_SingleGamePostSettings);
