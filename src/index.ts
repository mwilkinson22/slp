//Express & Middleware
import express, { Request, Response } from "express";
import compression from "compression";
import cookieSession from "cookie-session";
import passport from "passport";
import bodyParser from "body-parser";
import useragent from "express-useragent";
import { AppRouter } from "~/AppRouter";

//Modules
import "@babel/polyfill";
import mongoose from "mongoose";

//Helpers & Constants
import { keys } from "./config/keys";

//Register modules and configure mongoose
import "./models";
mongoose.connect(keys.mongoURI, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true
});

//Frontend
import renderer from "./helpers/server/renderer";
import createStore from "./helpers/server/createStore";
import "./client/scss/styles.scss";

//Actions
import { getCoreConfig } from "./client/actions/configActions";
import { fetchCurrentUser } from "./client/actions/userActions";

//Create Express App with middleware
const app = express();
app.use(bodyParser.json());
app.use(compression({ level: 9 }));
app.use(useragent.express());

//Set up passport
import "./services/passport";
app.use(
	cookieSession({
		maxAge: 365 * 24 * 60 * 60 * 1000,
		keys: [keys.cookieKey]
	})
);
app.use(passport.initialize());
app.use(passport.session());

//Static Routes
app.use(express.static("dist/public"));

//API Routes
import "./controllers";
app.use(AppRouter.getInstance());
app.all("/api*", (req: Request, res: Response) => {
	res.status(404).send("404 - Invalid API path");
});

//Render
app.get("*", async (req, res) => {
	//Create Store
	const store = createStore(req);

	//Get Basic Config
	await store.dispatch(getCoreConfig(req));
	await store.dispatch(fetchCurrentUser());

	const context: any = {};

	const content = renderer(req, store, context);

	if (context.url) {
		return res.redirect(301, context.url);
	}

	if (context.notFound) {
		res.status(404);
	}
	res.send(content);
});

if (keys.enableScheduledTasks) {
	require("./scheduledTasks");
}

export const PORT = process.env.PORT || 3000;
console.info("\x1b[32m", `Application started and listening on port ${PORT}`, "\x1b[0m");
app.listen(PORT);
