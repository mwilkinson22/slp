//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
interface ISetting_Root {
	_id: string | Types.ObjectId;
	name: string;
	value: string;
}
export interface ISetting extends ISetting_Root {
	_id: string;
}
export interface ISetting_Mongoose extends ISetting_Root, Document {
	_id: ISetting_Root["_id"];
}

export interface ISettings {}

export const defaultSettings: ISettings = {};

//Schema
const SettingSchema = new Schema<ISetting_Mongoose>({
	name: { type: String, required: true, unique: true },
	value: { type: String, required: true }
});

//Assign to mongoose
export const Settings = mongoose.model<ISetting_Mongoose>("settings", SettingSchema);
