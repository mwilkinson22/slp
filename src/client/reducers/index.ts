import { combineReducers } from "redux";
import configReducer, { ConfigState } from "./configReducer";
import { IConfigObject } from "~/client/actions/configActions";

interface InitialStoreState {
	config: ConfigState;
}

//Config will always be initialised before any components access
//it, so we override the interface here.
export interface StoreState extends InitialStoreState {
	config: IConfigObject;
}

export default combineReducers<InitialStoreState>({
	config: configReducer
});
