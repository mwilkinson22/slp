//Modules
import { toast } from "react-toastify";

//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";

//Enum
import { ActionTypes } from "./types";
import { KeyedCollection } from "~/types";
import { StoreState } from "~/client/reducers";
import { IGround } from "~/models/Ground";

//Action Interfaces
interface FetchGroundAction {
	type: ActionTypes.FETCH_GROUND;
	payload: IGround;
}
interface DeleteGroundAction {
	type: ActionTypes.DELETE_GROUND;
	payload: string;
}
interface FetchAllGroundsAction {
	type: ActionTypes.FETCH_ALL_GROUNDS;
	payload: KeyedCollection<IGround>;
}
export type GroundAction = FetchGroundAction | FetchAllGroundsAction | DeleteGroundAction;

export const fetchAllGrounds = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<KeyedCollection<IGround>>("/grounds");
		dispatch<FetchAllGroundsAction>({ type: ActionTypes.FETCH_ALL_GROUNDS, payload: res.data });
	};
};

export const createGround = (values: Partial<IGround>) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<IGround>("/grounds", values);
		if (res.data) {
			dispatch<FetchGroundAction>({ type: ActionTypes.FETCH_GROUND, payload: res.data });
			toast.success("Ground Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const updateGround = (id: string, values: Partial<IGround>) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.put<IGround>(`/grounds/${id}`, values);
		if (res.data) {
			dispatch<FetchGroundAction>({ type: ActionTypes.FETCH_GROUND, payload: res.data });
			toast.success("Ground Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const deleteGround = (id: string) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.delete<Record<string, never>>(`/grounds/${id}`);
		if (res.data) {
			dispatch<DeleteGroundAction>({ type: ActionTypes.DELETE_GROUND, payload: id });
			toast.success("Ground Deleted");
			return true;
		}
		return false;
	};
};
