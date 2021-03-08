import { ActionTypes } from "../actions/types";
import { GroundAction } from "~/client/actions/groundActions";
import { IGround } from "~/models/Ground";

export type GroundState = Record<IGround["_id"], IGround> | null;
export default function (state: GroundState = null, action: GroundAction): GroundState {
	switch (action.type) {
		case ActionTypes.FETCH_ALL_GROUNDS:
			return action.payload;

		case ActionTypes.FETCH_GROUND:
			return {
				...state,
				[action.payload._id]: action.payload
			};

		case ActionTypes.DELETE_GROUND: {
			const newState = { ...state };
			delete newState[action.payload];
			return newState;
		}

		default:
			return state;
	}
}
