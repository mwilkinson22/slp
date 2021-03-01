import { ActionTypes } from "../actions/types";
import { ConfigAction, IConfigObject } from "~/client/actions/configActions";
import { UserAction } from "~/client/actions/userActions";

export type ConfigState = IConfigObject | null;
export default function(state: ConfigState = null, action: ConfigAction | UserAction): ConfigState {
	switch (action.type) {
		case ActionTypes.FETCH_USER:
			if (state) {
				return { ...state, authUser: action.payload || undefined };
			} else {
				return state;
			}

		case ActionTypes.LOGOUT:
			if (state) {
				return { ...state, authUser: undefined };
			} else {
				return state;
			}

		case ActionTypes.GET_CORE_CONFIG:
			return { ...state, ...action.payload };

		default:
			return state;
	}
}
