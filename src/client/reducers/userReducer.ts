import { ActionTypes } from "../actions/types";
import { UserAction } from "~/client/actions/userActions";
import { IUser } from "~/models/User";

export type UserState = Record<IUser["_id"], IUser> | null;
export default function (state: UserState = null, action: UserAction): UserState {
	switch (action.type) {
		case ActionTypes.FETCH_ALL_USERS:
			return action.payload;

		case ActionTypes.FETCH_USER:
			return {
				...state,
				[action.payload._id]: action.payload
			};

		case ActionTypes.DELETE_USER: {
			const newState = { ...state };
			delete newState[action.payload];
			return newState;
		}

		default:
			return state;
	}
}
