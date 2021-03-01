//Interfaces
import { Dispatch } from "redux";
import { Request } from "express";
import { IUser } from "~/models/User";

//Enum
import { ActionTypes } from "./types";

//Define Config Interface
type DeviceType = "ios" | "android" | "desktop";
export interface IConfigObject {
	webp: boolean;
	deviceType: DeviceType;
	authUser?: IUser; //Called from userActions
}

//Action Interface
export interface CoreConfigAction {
	type: ActionTypes.GET_CORE_CONFIG;
	payload: IConfigObject;
}

export type ConfigAction = CoreConfigAction;

export const getCoreConfig = ({ headers, useragent }: Request) => async (dispatch: Dispatch) => {
	//Check for device
	let deviceType: DeviceType;
	if (useragent?.isiPad || useragent?.isiPhone) {
		deviceType = "ios";
	} else if (useragent?.isAndroid) {
		deviceType = "android";
	} else {
		deviceType = "desktop";
	}

	const config: IConfigObject = {
		//Set webp compatibility
		webp: headers?.accept?.includes("image/webp") || false,

		//Device Type
		deviceType
	};

	dispatch<CoreConfigAction>({ type: ActionTypes.GET_CORE_CONFIG, payload: config });
};
