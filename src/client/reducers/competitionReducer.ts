import { ActionTypes } from "../actions/types";
import { CompetitionAction } from "~/client/actions/competitionActions";
import { ICompetition } from "~/models/Competition";

export type CompetitionState = Record<ICompetition["_id"], ICompetition> | null;
export default function (state: CompetitionState = null, action: CompetitionAction): CompetitionState {
	switch (action.type) {
		case ActionTypes.FETCH_ALL_COMPETITIONS:
			return action.payload;

		case ActionTypes.FETCH_COMPETITION:
			return {
				...state,
				[action.payload._id]: action.payload
			};

		case ActionTypes.DELETE_COMPETITION: {
			const newState = { ...state };
			delete newState[action.payload];
			return newState;
		}

		default:
			return state;
	}
}
