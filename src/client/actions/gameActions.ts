//Modules
import { toast } from "react-toastify";

//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";

//Enum
import { ActionTypes } from "./types";
import { StoreState } from "~/client/reducers";
import { IGame, IGameFormFields } from "~/models/Game";
import { ISettings } from "~/models/Settings";

//Action Interfaces
interface FetchGameAction {
	type: ActionTypes.FETCH_GAME;
	payload: IGame;
}
interface DeleteGameAction {
	type: ActionTypes.DELETE_GAME;
	payload: string;
}
interface FetchAllGamesAction {
	type: ActionTypes.FETCH_ALL_GAMES;
	payload: Record<IGame["_id"], IGame>;
}
export type GameAction = FetchGameAction | FetchAllGamesAction | DeleteGameAction;

export const fetchAllGames = () => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<Record<IGame["_id"], IGame>>("/games");
		dispatch<FetchAllGamesAction>({ type: ActionTypes.FETCH_ALL_GAMES, payload: res.data });
	};
};

export const createGame = (values: IGameFormFields) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<IGame>("/games", values);
		if (res.data) {
			dispatch<FetchGameAction>({ type: ActionTypes.FETCH_GAME, payload: res.data });
			toast.success("Game Created Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const updateGame = (id: string, values: IGameFormFields) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.put<IGame>(`/games/${id}`, values);
		if (res.data) {
			dispatch<FetchGameAction>({ type: ActionTypes.FETCH_GAME, payload: res.data });
			toast.success("Game Updated Successfully");

			return res.data;
		} else {
			return false;
		}
	};
};

export const deleteGame = (id: string) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance) => {
		const res = await api.delete<Record<string, never>>(`/games/single/${id}`);
		if (res.data) {
			dispatch<DeleteGameAction>({ type: ActionTypes.DELETE_GAME, payload: id });
			toast.success("Game Deleted");
			return true;
		}
		return false;
	};
};

//Get Single Post Data
export const getSingleGamePostText = (_id?: string | null, overrideSettings?: ISettings["singleGamePost"]) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance): Promise<string | null> => {
		//If we don't pass in an _id, we send "any" to the server and will get a random game back
		const res = await api.post<string>(`/games/singlePostPreviewText/${_id || "any"}`, { overrideSettings });
		if (res.data) {
			return res.data;
		}
		return null;
	};
};

export const previewSingleGameImage = (_id?: string | null, overrideSettings?: ISettings["singleGamePost"]) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance): Promise<string | null> => {
		//If we don't pass in an _id, we send "any" to the server and will get a random game back
		const res = await api.post<string>(`/games/singlePostPreviewImage/${_id || "any"}`, { overrideSettings });
		if (res.data) {
			return res.data;
		}
		return null;
	};
};
