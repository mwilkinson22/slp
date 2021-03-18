//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
interface IGround_Root {
	_id: string | Types.ObjectId;
	name: string;
	tweetName?: string;
	city: string;
	image?: string;
}
export interface IGround extends IGround_Root {
	_id: string;
}
export interface IGround_Mongoose extends IGround_Root, Document {
	_id: IGround_Root["_id"];
}

export interface IGroundFormFields extends Required<Omit<IGround, "_id">> {}

//Schema
const GroundSchema = new Schema<IGround_Mongoose>({
	name: { type: String, required: true },
	tweetName: { type: String, default: null },
	city: { type: String, required: true },
	image: { type: String, default: null }
});

//Assign to mongoose
export const Ground = mongoose.model<IGround_Mongoose>("grounds", GroundSchema);
