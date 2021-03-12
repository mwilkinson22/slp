import { ActionTypes } from "../actions/types";
import { TeamAction } from "~/client/actions/teamActions";
import { ITeam } from "~/models/Team";

export type TeamState = Record<ITeam["_id"], ITeam> | null;
export default function (state: TeamState = null, action: TeamAction): TeamState {
	switch (action.type) {
		case ActionTypes.FETCH_ALL_TEAMS:
			return action.payload;

		case ActionTypes.FETCH_TEAM:
			return {
				...state,
				[action.payload._id]: action.payload
			};

		case ActionTypes.DELETE_TEAM: {
			const newState = { ...state };
			delete newState[action.payload];
			return newState;
		}

		default:
			return state;
	}
}
