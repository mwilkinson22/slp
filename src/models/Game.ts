//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
import { ITeam } from "~/models/Team";
import { IGround } from "~/models/Ground";
import { ICompetition } from "~/models/Competition";
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

type OptionalInMongoose = "overwriteHashtag" | "isOnTv" | "postAfterGame" | "includeInWeeklyPost" | "retweeted";
export interface IGame_Mongoose
	extends Omit<IGame_Root, "_id" | OptionalInMongoose>,
		Partial<Pick<IGame_Root, OptionalInMongoose>> {}

export interface IGameForImagePost extends Omit<IGame, "_homeTeam" | "_awayTeam" | "_ground" | "_competition"> {
	_homeTeam: ITeam;
	_awayTeam: ITeam;
	_ground?: IGround;
	_competition: ICompetition;
	hashtags: string[];
}

type FormFieldsToOmit = "_id" | "retweeted" | "tweetId";
export interface IGameFormFields extends Required<Omit<IGame, FormFieldsToOmit>> {
	time: string;
	disableRedirectOnAdd?: boolean;
}

type BulkFields = "_homeTeam" | "_awayTeam" | "date" | "round" | "isOnTv";
export type IBulkGame = Pick<IGameFormFields, BulkFields>;
export interface IGameBulkFormFields {
	games: IBulkGame[];
	_competition: IGameFormFields["_competition"];
	postAfterGame: IGameFormFields["postAfterGame"];
	includeInWeeklyPost: IGameFormFields["includeInWeeklyPost"];
}

export interface IGameBulkFormFieldsConfirmation {
	postAfterGame: IGameBulkFormFields["postAfterGame"];
	includeInWeeklyPost: IGameBulkFormFields["includeInWeeklyPost"];
}

export interface ISingleGamePostFields {
	_id: string;
	_profile: string;
	text: string;
	postToFacebook: boolean;
}

export interface IWeeklyPostFields {
	_profile: string;
	games: string[];
	text: string;
	postToFacebook: boolean;
}

//Schema
const GameSchema = new Schema<IGame_Mongoose & Document>(
	{
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
	},
	{
		toJSON: { virtuals: true }
	}
);

//Hashtags
GameSchema.virtual("hashtags").get(function (this: IGame_Mongoose | IGameForImagePost) {
	const { _homeTeam, _awayTeam, _competition, customHashtag, overwriteHashtag } = this;
	const hashtags = [];

	//Always add the custom hashtag if we have one
	if (customHashtag) {
		hashtags.push(customHashtag);
	}

	//If we've populated the comp, home and away values, we can auto-generate a hashtag
	if (typeof _competition === "object" && typeof _homeTeam === "object" && typeof _awayTeam === "object") {
		//Check we've not disabled this
		if (!customHashtag || !overwriteHashtag) {
			let autoHashtag = "";

			//Competition hashtag
			autoHashtag += _competition.hashtagPrefix;
			autoHashtag += _homeTeam.hashtag;
			autoHashtag += _awayTeam.hashtag;
			hashtags.push(autoHashtag);
		}
	}

	return hashtags;
});

//Population for image
GameSchema.query.forImage = function () {
	const teamFields = "name nickname image";
	return this.populate({ path: "_homeTeam", select: teamFields })
		.populate({ path: "_awayTeam", select: teamFields })
		.populate({ path: "_ground", select: "image" })
		.populate({ path: "_competition", select: "image" });
};

//Assign to mongoose
export const Game = mongoose.model<IGame_Mongoose & Document>("games", GameSchema);
