import { ActionTypes } from "../actions/types";
import { ProfileAction } from "~/client/actions/socialActions";
import { ISocialProfile } from "~/models/SocialProfile";

export type SocialState = Record<ISocialProfile["_id"], ISocialProfile> | null;
export default function (state: SocialState = null, action: ProfileAction): SocialState {
	switch (action.type) {
		case ActionTypes.FETCH_ALL_SOCIAL_PROFILES:
			return action.payload;

		case ActionTypes.FETCH_SOCIAL_PROFILE:
			return {
				...state,
				[action.payload._id]: action.payload
			};

		case ActionTypes.DELETE_SOCIAL_PROFILE: {
			const newState = { ...state };
			delete newState[action.payload];
			return newState;
		}

		default:
			return state;
	}
}
