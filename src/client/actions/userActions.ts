//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";
import { IUser } from "~/models/User";

//Enum
import { ActionTypes } from "./types";

//Action Interfaces
interface FetchUserAction {
	type: ActionTypes.FETCH_USER;
	payload: IUser;
}
interface LogoutAction {
	type: ActionTypes.LOGOUT;
}
export type UserAction = FetchUserAction | LogoutAction;

export const fetchUser = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<IUser>("/current_user");
		dispatch<FetchUserAction>({ type: ActionTypes.FETCH_USER, payload: res.data });
	};
};

export type LoginParams = { username: IUser["username"]; password: IUser["password"] };
export const login = (data: LoginParams) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<IUser>("/login", data);
		if (res.data) {
			dispatch<FetchUserAction>({ type: ActionTypes.FETCH_USER, payload: res.data });
			return true;
		} else {
			return false;
		}
	};
};

export const logout = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		await api.get("/logout");
		dispatch<LogoutAction>({ type: ActionTypes.LOGOUT });
	};
};
