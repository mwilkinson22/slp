//React
import React from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";

//Routing
import { BrowserRouter } from "react-router-dom";
import { renderRoutes } from "react-router-config";
import Routes from "./Routes";

//Redux
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import reducers, { StoreState } from "./reducers";

//Polyfills
import "@babel/polyfill";
import { polyfill } from "es6-promise";
polyfill();

//Stylesheets
import "./scss/styles.scss";

//Set up axios instance
import axios, { AxiosResponse } from "axios";
const axiosInstance = axios.create({
	baseURL: "/api"
});
axiosInstance.interceptors.response.use(
	function (response: AxiosResponse) {
		return response;
	},
	function (error) {
		if (error.response) {
			if (error.response.status === 401) {
				console.error("401 Authentication error");
				//No need for toastify as we handle this in the login panel
				return error;
			}

			const { status, statusText } = error.response;
			let errorMessage;
			if (typeof error.response.data === "string") {
				errorMessage = error.response.data;
			} else if (error.response.data.error) {
				errorMessage = error.response.data.error;
			}
			toast.error(`${status} ${statusText}${errorMessage ? ": " + errorMessage : ""}`);
			if (error.response.data.toLog) {
				console.info(error.response.data.toLog);
				toast.error("See console log for more details");
			}
		}
		return error;
	}
);

declare global {
	interface Window {
		INITIAL_STATE: StoreState;
	}
}
const store = createStore(reducers, window.INITIAL_STATE, applyMiddleware(thunk.withExtraArgument(axiosInstance)));

ReactDOM.hydrate(
	<Provider store={store}>
		<BrowserRouter>
			<div>{renderRoutes(Routes)}</div>
		</BrowserRouter>
	</Provider>,
	document.querySelector("#root")
);
