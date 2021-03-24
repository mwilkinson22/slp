//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";
import { ISettings } from "~/models/Settings";

type ValidationSuccess = {
	authenticated: true;
	user: string;
};
type ValidationFailure = {
	authenticated: false;
	error: string;
};
export type TwitterValidationResult = ValidationSuccess | ValidationFailure;

export const validateTwitterApp = (settings: ISettings["twitterApp"]) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance): Promise<TwitterValidationResult> => {
		const res = await api.post<TwitterValidationResult>("/social/twitter/test-app", settings);
		if (res.data) {
			return res.data;
		} else {
			return { authenticated: false, error: "Unknown Error Occurred" };
		}
	};
};
