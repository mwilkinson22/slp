//Modules
import _ from "lodash";

//Interfaces
import { Dispatch } from "redux";
import { Request } from "express";
import { IUser } from "~/models/User";

//Constants
import { keys } from "~/config/keys";
const { googleBucketName } = keys;

//Enum
import { ActionTypes } from "./types";
import { BucketImagePaths } from "~/enum/BucketImagePaths";

//Config Interfaces
type DeviceType = "ios" | "android" | "desktop";
type BucketPaths = {
	root: string;
	images: Record<keyof typeof BucketImagePaths, string>;
};
export interface IConfigObject {
	authUser?: IUser; //Called from userActions
	deviceType: DeviceType;
	webp: boolean;
	bucketPaths: BucketPaths;
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

	//Get bucket paths
	const bucketPathRoot = `https://storage.googleapis.com/${googleBucketName}/`;
	const imageBucketPaths: BucketPaths["images"] = {
		competitions: "/competitions",
		games: "/games",
		grounds: "/grounds",
		layout: "/layout",
		root: "",
		users: "/users"
	};

	const config: IConfigObject = {
		//Set webp compatibility
		webp: headers?.accept?.includes("image/webp") || false,

		//Device Type
		deviceType,

		//Bucket Paths
		bucketPaths: {
			root: bucketPathRoot,
			images: _.mapValues(imageBucketPaths, value => `${bucketPathRoot}images/${value}`)
		}
	};

	dispatch<CoreConfigAction>({ type: ActionTypes.GET_CORE_CONFIG, payload: config });
};
