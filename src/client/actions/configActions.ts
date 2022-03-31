//Modules
import _ from "lodash";
import { toast } from "react-toastify";

//Interfaces
import { Dispatch } from "redux";
import { Request } from "express";
import { IUser } from "~/models/User";
import { ISettings } from "~/models/Settings";
import { AxiosInstance } from "axios";

//Constants
import { keys } from "~/config/keys";
const { googleBucketName } = keys;

//Enum
import { ActionTypes } from "./types";
import { BucketImagePaths } from "~/enum/BucketImagePaths";
import { StoreState } from "~/client/reducers";

//Config Interfaces
type DeviceType = "ios" | "android" | "desktop";
type BucketPaths = {
	root: string;
	images: Record<keyof typeof BucketImagePaths, string>;
};
export interface IConfigObject {
	authUser?: IUser; //Called from userActions
	bucketPaths: BucketPaths;
	deviceType: DeviceType;
	settings?: ISettings;
	webp: boolean;
}

//Action Interface
export interface CoreConfigAction {
	type: ActionTypes.GET_CORE_CONFIG;
	payload: IConfigObject;
}

export interface GetSettingsAction {
	type: ActionTypes.GET_SETTINGS;
	payload: Partial<ISettings>;
}

export interface GetAllSettingsAction {
	type: ActionTypes.GET_ALL_SETTINGS;
	payload: ISettings;
}

export type ConfigAction = CoreConfigAction | GetSettingsAction | GetAllSettingsAction;

export const getCoreConfig = ({ headers, useragent, user }: Request) => async (
	dispatch: Dispatch,
	getState: any,
	api: AxiosInstance
) => {
	//Check for device
	let deviceType: DeviceType;
	if (useragent?.isiPad || useragent?.isiPhone) {
		deviceType = "ios";
	} else if (useragent?.isAndroid) {
		deviceType = "android";
	} else {
		deviceType = "desktop";
	}

	//Get bucket paths
	const bucketPathRoot = `https://storage.googleapis.com/${googleBucketName}/`;
	const imageBucketPaths: BucketPaths["images"] = {
		competitions: "competitions/",
		games: "games/",
		grounds: "grounds/",
		layout: "layout/",
		root: "",
		teams: "teams/",
		users: "users/"
	};

	//Get Settings
	let settings;
	if (user) {
		const settingsCall = await api.get<ISettings>("/settings");
		settings = settingsCall.data;
	}

	const config: IConfigObject = {
		//Set webp compatibility
		webp: headers?.accept?.includes("image/webp") || false,

		//Device Type
		deviceType,

		//Bucket Paths
		bucketPaths: {
			root: bucketPathRoot,
			images: _.mapValues(imageBucketPaths, value => `${bucketPathRoot}images/${value}`)
		},

		settings
	};

	dispatch<CoreConfigAction>({ type: ActionTypes.GET_CORE_CONFIG, payload: config });
};

/**
 *
 * @param data the settings object to update
 * @param settingGroupName Used in the toast pop-up on completion
 */
export const updateSettings = (data: Partial<ISettings>, settingGroupName: string = "Settings") => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.post("/settings", data);
		if (res.data) {
			dispatch<GetSettingsAction>({ type: ActionTypes.GET_SETTINGS, payload: data });
			toast.success(`${settingGroupName} successfully updated`);
		}
	};
};
