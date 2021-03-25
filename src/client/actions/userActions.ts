//Modules
import { toast } from "react-toastify";

//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";
import { IUser, IUserFormFields } from "~/models/User";

//Enum
import { ActionTypes } from "./types";
import { StoreState } from "~/client/reducers";

//Settings action
import { GetAllSettingsAction } from "~/client/actions/configActions";
import { ISettings } from "~/models/Settings";

//Action Interfaces
interface FetchCurrentUserAction {
	type: ActionTypes.FETCH_CURRENT_USER;
	payload: IUser;
}
interface FetchUserAction {
	type: ActionTypes.FETCH_USER;
	payload: IUser;
}
interface DeleteUserAction {
	type: ActionTypes.DELETE_USER;
	payload: string;
}
interface FetchAllUsersAction {
	type: ActionTypes.FETCH_ALL_USERS;
	payload: Record<IUser["_id"], IUser>;
}
interface LogoutAction {
	type: ActionTypes.LOGOUT;
}
export type UserAction =
	| FetchCurrentUserAction
	| LogoutAction
	| FetchUserAction
	| DeleteUserAction
	| FetchAllUsersAction;

export const fetchCurrentUser = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<IUser>("/current_user");
		dispatch<FetchCurrentUserAction>({ type: ActionTypes.FETCH_CURRENT_USER, payload: res.data });
	};
};

export type LoginParams = { username: IUser["username"]; password: IUser["password"] };
export const login = (data: LoginParams) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<IUser>("/login", data);
		if (res.data) {
			//We need to fetch settings before dispatching the user
			const settingsCall = await api.get<ISettings>("/settings");
			if (settingsCall.data) {
				dispatch<GetAllSettingsAction>({ type: ActionTypes.GET_SETTINGS, payload: settingsCall.data });
			}

			dispatch<FetchCurrentUserAction>({ type: ActionTypes.FETCH_CURRENT_USER, payload: res.data });
			return true;
		} else {
			return false;
		}
	};
};

export const fetchAllUsers = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<Record<IUser["_id"], IUser>>("/users");
		dispatch<FetchAllUsersAction>({ type: ActionTypes.FETCH_ALL_USERS, payload: res.data });
	};
};

export const createUser = (values: IUserFormFields) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<IUser>("/user", values);
		if (res.data) {
			dispatch<FetchUserAction>({ type: ActionTypes.FETCH_USER, payload: res.data });
			toast.success("User Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const updateUser = (id: string, values: IUserFormFields) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.put<IUser>(`/user/${id}`, values);
		if (res.data) {
			const authUser = getState().config.authUser as IUser;
			//If we're updating the active user, update the config reducer
			if (authUser._id === id) {
				dispatch<FetchCurrentUserAction>({ type: ActionTypes.FETCH_CURRENT_USER, payload: res.data });
			}

			//For admins, also update user list
			if (authUser.isAdmin) {
				dispatch<FetchUserAction>({ type: ActionTypes.FETCH_USER, payload: res.data });
			}

			toast.success("User Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const deleteUser = (id: string) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.delete<Record<string, never>>(`/user/${id}`);
		if (res.data) {
			dispatch<DeleteUserAction>({ type: ActionTypes.DELETE_USER, payload: id });
			toast.success("User Deleted");
			return true;
		}
		return false;
	};
};

export const logout = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		await api.get("/logout");
		dispatch<LogoutAction>({ type: ActionTypes.LOGOUT });
	};
};
