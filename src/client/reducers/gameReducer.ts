import { ActionTypes } from "../actions/types";
import { GameAction } from "~/client/actions/gameActions";
import { IGame } from "~/models/Game";

export type GameState = Record<IGame["_id"], IGame> | null;
export default function (state: GameState = null, action: GameAction): GameState {
	switch (action.type) {
		case ActionTypes.FETCH_ALL_GAMES:
			return action.payload;

		case ActionTypes.FETCH_GAME:
			return {
				...state,
				[action.payload._id]: action.payload
			};

		case ActionTypes.FETCH_GAMES:
			return {
				...state,
				...action.payload
			};

		case ActionTypes.DELETE_GAME: {
			const newState = { ...state };
			delete newState[action.payload];
			return newState;
		}

		default:
			return state;
	}
}
