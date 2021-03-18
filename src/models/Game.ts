//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
interface IGame_Root {
	//Basic Info
	_id: string | Types.ObjectId;
	_homeTeam: string;
	_awayTeam: string;
	_ground?: string;
	_competition: string;
	date: string;
	round?: string;
	customHashtag?: string;
	overwriteHashtag: boolean;
	isOnTv: boolean;
	image?: string;

	//Social Posting Settings
	postAfterGame: boolean;
	includeInWeeklyPost: boolean;
	tweetId?: string;
	retweeted: boolean;
}
export interface IGame extends IGame_Root {
	_id: string;
}
export interface IGame_Mongoose extends IGame_Root, Document {
	_id: IGame_Root["_id"];
	date: string;
}

type FormFieldsToOmit = "_id" | "retweeted" | "tweetId";
export interface IGameFormFields extends Required<Omit<IGame, FormFieldsToOmit>> {
	time: string;
	disableRedirectOnAdd?: boolean;
}

//Schema
const GameSchema = new Schema<IGame_Mongoose>({
	_homeTeam: { type: Schema.Types.ObjectId, ref: "teams", required: true },
	_awayTeam: { type: Schema.Types.ObjectId, ref: "teams", required: true },
	_ground: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
	_competition: { type: Schema.Types.ObjectId, ref: "competitions", required: true },
	round: { type: String, default: null },
	date: { type: Date, required: true },
	customHashtag: { type: String, default: null },
	overwriteHashtag: { type: Boolean, default: false },
	isOnTv: { type: Boolean, required: true },
	image: { type: String, default: null },

	postAfterGame: { type: Boolean, required: true },
	includeInWeeklyPost: { type: Boolean, required: true },
	tweetId: { type: String, default: null },
	retweeted: { type: Boolean, default: false }
});

//Assign to mongoose
export const Game = mongoose.model<IGame_Mongoose>("games", GameSchema);
