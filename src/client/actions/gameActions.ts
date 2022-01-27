//Modules
import { toast } from "react-toastify";

//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";

//Enum
import { ActionTypes } from "./types";
import { StoreState } from "~/client/reducers";
import {
	IGame,
	IGameBulkFormFields,
	IGameForImagePost,
	IGameFormFields,
	ISingleGamePostFields,
	IWeeklyPostFields
} from "~/models/Game";
import { ISettings } from "~/models/Settings";

//Action Interfaces
type GameRecord = StoreState["games"];
interface FetchGameAction {
	type: ActionTypes.FETCH_GAME;
	payload: IGame;
}
interface DeleteGameAction {
	type: ActionTypes.DELETE_GAME;
	payload: string;
}
interface FetchGamesAction {
	type: ActionTypes.FETCH_GAMES;
	payload: GameRecord;
}
interface FetchAllGamesAction {
	type: ActionTypes.FETCH_ALL_GAMES;
	payload: GameRecord;
}

export type GameAction = FetchGameAction | FetchGamesAction | FetchAllGamesAction | DeleteGameAction;

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

export const bulkCreateGames = (values: IGameBulkFormFields) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<GameRecord>("/games/bulk", values);
		if (res.data) {
			dispatch<FetchGamesAction>({ type: ActionTypes.FETCH_GAMES, payload: res.data });
			const gameCount = values.games.length;
			toast.success(`${gameCount} ${gameCount === 1 ? "Game" : "Games"} Created Successfully`);
			return true;
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

//Single Game Social Posts
export const fetchGameForImagePost = (_id: string) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<IGameForImagePost>(`/games/forImagePost/${_id}`);
		if (res.data) {
			return res.data;
		} else {
			return false;
		}
	};
};
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

export const previewWeeklyPostImage = (games: string[] | null, overrideSettings?: ISettings["weeklyPost"]) => {
	return async (dispatch: Dispatch, getState: () => StoreState, api: AxiosInstance): Promise<string | null> => {
		const res = await api.post<string>("/games/weeklyPostPreviewImage/", { games, overrideSettings });
		if (res.data) {
			return res.data;
		}
		return null;
	};
};

type PostSubmitResponse = { error?: string };
export const submitSingleGameImagePost = (values: ISingleGamePostFields) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<PostSubmitResponse>(`/games/singleImagePost/`, values);
		if (res.data && !res.data.error) {
			toast.success("Post Submitted Successfully");
		} else {
			toast.error(res.data.error || "An Unknown Error Occurred");
		}
	};
};

export const submitWeeklyPost = (values: IWeeklyPostFields) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<PostSubmitResponse>(`/games/weeklyPost/`, values);
		if (res.data && !res.data.error) {
			toast.success("Post Submitted Successfully");
		} else {
			toast.error(res.data.error || "An Unknown Error Occurred");
		}
	};
};
