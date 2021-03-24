//Modules
import { toast } from "react-toastify";

//Actions
import { ActionTypes } from "~/client/actions/types";

//Interfaces
import { AxiosInstance } from "axios";
import { Dispatch } from "redux";
import { StoreState } from "~/client/reducers";

//Models
import { ISettings } from "~/models/Settings";
import { ISocialProfile, ISocialProfileFormFields } from "~/models/SocialProfile";

//Twitter Validation Types
type ValidationSuccess = {
	authenticated: true;
	user: string;
};
type ValidationFailure = {
	authenticated: false;
	error: string;
};
export type TwitterValidationResult = ValidationSuccess | ValidationFailure;

//Action interfaces
interface FetchProfileAction {
	type: ActionTypes.FETCH_SOCIAL_PROFILE;
	payload: ISocialProfile;
}
interface DeleteProfileAction {
	type: ActionTypes.DELETE_SOCIAL_PROFILE;
	payload: string;
}
interface FetchAllProfilesAction {
	type: ActionTypes.FETCH_ALL_SOCIAL_PROFILES;
	payload: Record<ISocialProfile["_id"], ISocialProfile>;
}
export type ProfileAction = FetchProfileAction | DeleteProfileAction | FetchAllProfilesAction;

//Social Profile Actions
export const fetchAllSocialProfiles = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<FetchAllProfilesAction["payload"]>("/social/profiles");
		dispatch<FetchAllProfilesAction>({ type: ActionTypes.FETCH_ALL_SOCIAL_PROFILES, payload: res.data });
	};
};
export const createSocialProfile = (values: ISocialProfileFormFields) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<ISocialProfile>("/social/profiles", values);
		if (res.data) {
			dispatch<FetchProfileAction>({ type: ActionTypes.FETCH_SOCIAL_PROFILE, payload: res.data });
			toast.success("Social Profile Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const updateSocialProfile = (id: string, values: ISocialProfileFormFields) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.put<ISocialProfile>(`/social/profiles/${id}`, values);
		if (res.data) {
			dispatch<FetchProfileAction>({ type: ActionTypes.FETCH_SOCIAL_PROFILE, payload: res.data });
			toast.success("Social Profile Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const deleteSocialProfile = (id: string) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.delete<Record<string, never>>(`/social/profiles/${id}`);
		if (res.data) {
			dispatch<DeleteProfileAction>({ type: ActionTypes.DELETE_SOCIAL_PROFILE, payload: id });
			toast.success("Social Profile Deleted");
			return true;
		}
		return false;
	};
};

//Twitter Actions
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

export const getAuthorisedAccounts = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		type ReturnedType = Pick<ISettings["twitterApp"], "access_token" | "access_token_secret"> | "";
		const res = await api.get<ReturnedType>("/social/oauth/twitter/authorisedAccount");
		if (res.data) {
			return res.data;
		} else {
			return false;
		}
	};
};
