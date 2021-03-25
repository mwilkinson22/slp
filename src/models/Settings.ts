//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
interface ISetting_Root {
	_id: string | Types.ObjectId;
	name: string;
	group: string;
	value: string;
}
export interface ISetting extends ISetting_Root {
	_id: string;
}
export interface ISetting_Mongoose extends ISetting_Root, Document {
	_id: ISetting_Root["_id"];
}

export interface ISettings {
	singleGamePost: {
		defaultTweetText: string;
		defaultImageText: string;
		teamName: "short" | "long" | "nickname";
		backupGroundText: string;
	};
	multiGamePost: {
		defaultText: string;
		//"0" = Sunday, "1" = Monday, etc
		postDate: string;
		postTime: string;
	};
	twitterApp: {
		consumer_key: string;
		consumer_secret: string;
		access_token: string;
		access_token_secret: string;
	};
	googleForm: {
		link: string;
	};
}

export const defaultSettings: ISettings = {
	singleGamePost: {
		defaultTweetText: "",
		defaultImageText: "",
		teamName: "short",
		backupGroundText: "the Game"
	},
	multiGamePost: {
		defaultText: "",
		postDate: "5",
		postTime: "18:00"
	},
	twitterApp: {
		consumer_key: "",
		consumer_secret: "",
		access_token: "",
		access_token_secret: ""
	},
	googleForm: {
		link: ""
	}
};

//Schema
const SettingSchema = new Schema<ISetting_Mongoose>({
	name: { type: String, required: true, unique: true },
	group: { type: String, required: true },
	value: { type: String, required: true }
});

//Assign to mongoose
export const Settings = mongoose.model<ISetting_Mongoose>("settings", SettingSchema);
