//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
interface IGround_Root {
	_id: string | Types.ObjectId;
	name: string;
	addTheToTweets: string;
	city: string;
	hasImage: boolean;
}
export interface IGround extends IGround_Root {
	_id: string;
}
export interface IGround_Mongoose extends IGround_Root, Document {
	_id: IGround_Root["_id"];
}

//Schema
const GroundSchema = new Schema<IGround_Mongoose>({
	name: { type: String, required: true },
	addTheToTweets: { type: Boolean, required: true, default: false },
	city: { type: String, required: true },
	hasImage: { type: Boolean, required: true, default: false }
});

//Assign to mongoose
export const Ground = mongoose.model<IGround_Mongoose>("grounds", GroundSchema);
