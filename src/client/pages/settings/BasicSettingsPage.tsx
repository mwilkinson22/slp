//Modules
import React, { ComponentType } from "react";
import { connect, ConnectedProps } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

//Components
import { BasicForm, IPassedProps as FormProps } from "~/client/components/forms/BasicForm";

//Actions
import { updateSettings } from "~/client/actions/configActions";

//Interfaces & Enums
import { ISettings } from "~/models/Settings";
interface IPassedProps<T> {
	fieldGroups: FormProps<T>["fieldGroups"];
	settingGroup: keyof ISettings;
	validationSchema: FormProps<T>["validationSchema"];
}
interface IProps<T> extends IPassedProps<T>, ConnectedProps<typeof connector>, RouteComponentProps<any> {}

//Redux
import { StoreState } from "~/client/reducers";
function mapStateToProps({ config }: StoreState) {
	const { settings } = config;
	return { settings: settings as ISettings };
}
const mapDispatchToProps = { updateSettings };
const connector = connect(mapStateToProps, mapDispatchToProps);

//Component
function _BasicSettingsPage<T extends ISettings[keyof ISettings]>(props: IProps<T>) {
	const { fieldGroups, settings, settingGroup, updateSettings, validationSchema } = props;

	return (
		<BasicForm<T>
			fieldGroups={fieldGroups}
			initialValues={settings[settingGroup] as T}
			isNew={false}
			itemType={"Settings"}
			onSubmit={values => updateSettings({ [settingGroup]: values }, "Game Post Settings")}
			showErrorSummary={false}
			validationSchema={validationSchema}
		/>
	);
}

export function BasicSettingsPage<T>(passedProps: IPassedProps<T>) {
	const props = {
		...passedProps
	};
	return React.createElement(connector(_BasicSettingsPage as ComponentType<IPassedProps<T>>), props);
}
