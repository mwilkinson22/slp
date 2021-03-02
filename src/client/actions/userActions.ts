//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";
import { IUser } from "~/models/User";

//Enum
import { ActionTypes } from "./types";
import { KeyedCollection } from "~/types";

//Action Interfaces
interface FetchCurrentUserAction {
	type: ActionTypes.FETCH_CURRENT_USER;
	payload: IUser;
}
interface FetchUserAction {
	type: ActionTypes.FETCH_USER;
	payload: IUser;
}
interface FetchAllUsersAction {
	type: ActionTypes.FETCH_ALL_USERS;
	payload: KeyedCollection<IUser>;
}
interface LogoutAction {
	type: ActionTypes.LOGOUT;
}
export type UserAction = FetchCurrentUserAction | LogoutAction | FetchUserAction | FetchAllUsersAction;

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
			dispatch<FetchCurrentUserAction>({ type: ActionTypes.FETCH_CURRENT_USER, payload: res.data });
			return true;
		} else {
			return false;
		}
	};
};

export const fetchAllUsers = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<KeyedCollection<IUser>>("/users");
		dispatch<FetchAllUsersAction>({ type: ActionTypes.FETCH_ALL_USERS, payload: res.data });
	};
};

export const logout = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		await api.get("/logout");
		dispatch<LogoutAction>({ type: ActionTypes.LOGOUT });
	};
};
