//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
interface ISocialProfile_Root {
	_id: string | Types.ObjectId;
	name: string;
	twitter_access_token: string;
	twitter_access_token_secret: string;
	ifttt_key?: string;
	isDefault: boolean;
}
export interface ISocialProfile extends ISocialProfile_Root {
	_id: string;
}
export interface ISocialProfile_Mongoose extends ISocialProfile_Root, Document {
	_id: ISocialProfile_Root["_id"];
}

export interface ISocialProfileFormFields extends Required<Omit<ISocialProfile, "_id" | "isDefault">> {}

//Schema
const SocialProfileSchema = new Schema<ISocialProfile_Mongoose>({
	name: { type: String, required: true },
	twitter_access_token: { type: String, required: true },
	twitter_access_token_secret: { type: String, required: true },
	ifttt_key: { type: String, default: null },
	isDefault: { type: Boolean, default: false }
});

//Assign to mongoose
export const SocialProfile = mongoose.model<ISocialProfile_Mongoose>("socialProfiles", SocialProfileSchema);
