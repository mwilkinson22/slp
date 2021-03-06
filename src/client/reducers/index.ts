import { combineReducers } from "redux";
import configReducer, { ConfigState } from "./configReducer";
import userReducer, { UserState } from "~/client/reducers/userReducer";
import groundReducer, { GroundState } from "~/client/reducers/groundReducer";
import { IConfigObject } from "~/client/actions/configActions";

interface InitialStoreState {
	config: ConfigState;
	grounds: GroundState;
	users: UserState;
}

//Config will always be initialised before any components access
//it, so we override the interface here.
export interface StoreState extends InitialStoreState {
	config: IConfigObject;
}

export default combineReducers<InitialStoreState>({
	config: configReducer,
	grounds: groundReducer,
	users: userReducer
});
