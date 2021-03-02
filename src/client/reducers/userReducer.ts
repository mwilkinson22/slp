import { ActionTypes } from "../actions/types";
import { UserAction } from "~/client/actions/userActions";
import { KeyedCollection } from "~/types";
import { IUser } from "~/models/User";

export type UserState = KeyedCollection<IUser> | null;
export default function(state: UserState = null, action: UserAction): UserState {
	switch (action.type) {
		case ActionTypes.FETCH_ALL_USERS:
			return action.payload;

		default:
			return state;
	}
}
