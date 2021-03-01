//Modules
import { Request } from "express";
import { createStore, applyMiddleware } from "redux";
import axios from "axios";
import thunk from "redux-thunk";

//Redux
import reducers from "../../client/reducers";
import { PORT } from "~/index";

export default (req: Request) => {
	const axiosInstance = axios.create({
		baseURL: `http://localhost:${PORT}/api`,
		headers: { cookie: req.get("cookie") || "" }
	});
	return createStore(reducers, {}, applyMiddleware(thunk.withExtraArgument(axiosInstance)));
};
