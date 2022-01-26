//Modules
import { toast } from "react-toastify";

//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";

//Enum
import { ActionTypes } from "./types";
import { StoreState } from "~/client/reducers";
import { ICompetition, ICompetitionFormFields } from "~/models/Competition";
import { IBulkGame } from "~/models/Game";

//Action Interfaces
interface FetchCompetitionAction {
	type: ActionTypes.FETCH_COMPETITION;
	payload: ICompetition;
}
interface DeleteCompetitionAction {
	type: ActionTypes.DELETE_COMPETITION;
	payload: string;
}
interface FetchAllCompetitionsAction {
	type: ActionTypes.FETCH_ALL_COMPETITIONS;
	payload: Record<ICompetition["_id"], ICompetition>;
}
export type CompetitionAction = FetchCompetitionAction | FetchAllCompetitionsAction | DeleteCompetitionAction;

export const fetchAllCompetitions = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<Record<ICompetition["_id"], ICompetition>>("/competitions");
		dispatch<FetchAllCompetitionsAction>({ type: ActionTypes.FETCH_ALL_COMPETITIONS, payload: res.data });
	};
};

export const createCompetition = (values: ICompetitionFormFields) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<ICompetition>("/competitions", values);
		if (res.data) {
			dispatch<FetchCompetitionAction>({ type: ActionTypes.FETCH_COMPETITION, payload: res.data });
			toast.success("Competition Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const updateCompetition = (id: string, values: ICompetitionFormFields) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.put<ICompetition>(`/competitions/${id}`, values);
		if (res.data) {
			dispatch<FetchCompetitionAction>({ type: ActionTypes.FETCH_COMPETITION, payload: res.data });
			toast.success("Competition Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const deleteCompetition = (id: string) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.delete<Record<string, never>>(`/competitions/${id}`);
		if (res.data) {
			dispatch<DeleteCompetitionAction>({ type: ActionTypes.DELETE_COMPETITION, payload: id });
			toast.success("Competition Deleted");
			return true;
		}
		return false;
	};
};

export const fetchExternalGames = (id: string) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.get<Record<"games", IBulkGame[]>>(`/competitions/externalGames/${id}`);
		if (res.data) {
			return res.data.games;
		} else {
			return false;
		}
	};
};
