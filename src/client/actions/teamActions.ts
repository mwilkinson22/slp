//Modules
import { toast } from "react-toastify";

//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";

//Enum
import { ActionTypes } from "./types";
import { StoreState } from "~/client/reducers";
import { ITeam, ITeamFormFields } from "~/models/Team";

//Action Interfaces
interface FetchTeamAction {
	type: ActionTypes.FETCH_TEAM;
	payload: ITeam;
}
interface DeleteTeamAction {
	type: ActionTypes.DELETE_TEAM;
	payload: string;
}
interface FetchAllTeamsAction {
	type: ActionTypes.FETCH_ALL_TEAMS;
	payload: Record<ITeam["_id"], ITeam>;
}
export type TeamAction = FetchTeamAction | FetchAllTeamsAction | DeleteTeamAction;

export const fetchAllTeams = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<Record<ITeam["_id"], ITeam>>("/teams");
		dispatch<FetchAllTeamsAction>({ type: ActionTypes.FETCH_ALL_TEAMS, payload: res.data });
	};
};

export const createTeam = (values: ITeamFormFields) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<ITeam>("/teams", values);
		if (res.data) {
			dispatch<FetchTeamAction>({ type: ActionTypes.FETCH_TEAM, payload: res.data });
			toast.success("Team Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const updateTeam = (id: string, values: ITeamFormFields) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.put<ITeam>(`/teams/${id}`, values);
		if (res.data) {
			dispatch<FetchTeamAction>({ type: ActionTypes.FETCH_TEAM, payload: res.data });
			toast.success("Team Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const deleteTeam = (id: string) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.delete<Record<string, never>>(`/teams/${id}`);
		if (res.data) {
			dispatch<DeleteTeamAction>({ type: ActionTypes.DELETE_TEAM, payload: id });
			toast.success("Team Deleted");
			return true;
		}
		return false;
	};
};
