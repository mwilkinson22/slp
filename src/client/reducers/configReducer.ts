import { ActionTypes } from "../actions/types";
import { ConfigAction, IConfigObject } from "~/client/actions/configActions";
import { UserAction } from "~/client/actions/userActions";

export type ConfigState = IConfigObject | null;
export default function (state: ConfigState = null, action: ConfigAction | UserAction): ConfigState {
	switch (action.type) {
		case ActionTypes.FETCH_CURRENT_USER:
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

		case ActionTypes.GET_SETTINGS: {
			if (state) {
				const settings = { ...state.settings };
				Object.assign(settings, action.payload);
				return {
					...state,
					settings
				};
			}
			return state;
		}

		default:
			return state;
	}
}
