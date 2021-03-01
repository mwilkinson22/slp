//Passport
const passport = require("passport");
import { Strategy } from "passport-local";

//User Model
import { User, IUser_Mongoose } from "~/models/User";

//Types
type SerializeDone = (error: Error | null, id: string) => void;
type DeserializeDone = (error: Error | null, user: IUser_Mongoose | false) => void;

//Save user id to session
passport.serializeUser((user: IUser_Mongoose, done: SerializeDone) => {
	done(null, user._id);
});

//Pull user object from id saved to session
passport.deserializeUser(async (id: string, done: DeserializeDone) => {
	const user = await User.findById(id);
	done(null, user || false);
});

//Attempt Login
passport.use(
	new Strategy(async (username: string, password: string, done) => {
		const user = await User.findOne({ username });

		if (user?.validatePassword(password)) {
			return done(null, user);
		}

		return done(null, false);
	})
);
