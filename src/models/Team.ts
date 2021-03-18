//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
interface ITeam_Root {
	_id: string | Types.ObjectId;
	name: {
		short: string;
		long: string;
	};
	nickname: string;
	hashtag: string;
	_ground: string;
	colours: {
		main: string;
		text: string;
		trim: string;
	};
	image: string;
	isFavourite: boolean;
}
export interface ITeam extends ITeam_Root {
	_id: string;
}
export interface ITeam_Mongoose extends ITeam_Root, Document {
	_id: ITeam_Root["_id"];
}

export interface ITeamFormFields extends Required<Omit<ITeam, "_id">> {}

//Schema
const TeamSchema = new Schema<ITeam_Mongoose>({
	name: {
		short: { type: String, required: true },
		long: { type: String, required: true }
	},
	nickname: { type: String, required: true },
	hashtag: { type: String, required: true },
	_ground: { type: Schema.Types.ObjectId, ref: "grounds", required: true },
	colours: {
		main: { type: String, required: true },
		text: { type: String, required: true },
		trim: { type: String, required: true }
	},
	image: { type: String, required: true },
	isFavourite: { type: Boolean, default: false }
});

//Assign to mongoose
export const Team = mongoose.model<ITeam_Mongoose>("teams", TeamSchema);
