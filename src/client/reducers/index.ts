import { combineReducers } from "redux";

import configReducer, { ConfigState } from "./configReducer";
import competitionReducer, { CompetitionState } from "~/client/reducers/competitionReducer";
import groundReducer, { GroundState } from "~/client/reducers/groundReducer";
import userReducer, { UserState } from "~/client/reducers/userReducer";

interface InitialStoreState {
	config: ConfigState;
	competitions: CompetitionState;
	grounds: GroundState;
	users: UserState;
}

//Config will always be initialised before any components access
//it, so we override the interface here.
import { IConfigObject } from "~/client/actions/configActions";
export interface StoreState extends InitialStoreState {
	config: IConfigObject;
}

export default combineReducers<InitialStoreState>({
	config: configReducer,
	competitions: competitionReducer,
	grounds: groundReducer,
	users: userReducer
});
