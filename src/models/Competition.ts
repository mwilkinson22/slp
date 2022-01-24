//Modules
import mongoose, { Schema, Document, Types } from "mongoose";

//Interfaces
interface ICompetition_Root {
	_id: string | Types.ObjectId;
	name: string;
	hashtagPrefix: string;
	competitionHashtag: string | null;
	image: string;
	isFavourite: boolean;
	externalCompId: number | null | string;
	externalDivId: number | null | string;
}
export interface ICompetition extends ICompetition_Root {
	_id: string;
	externalCompId: number | null;
	externalDivId: number | null;
}
export interface ICompetition_Mongoose extends ICompetition_Root, Document {
	_id: ICompetition_Root["_id"];
	externalCompId: number | null;
	externalDivId: number | null;
}

export interface ICompetitionFormFields extends Omit<ICompetition_Root, "_id"> {
	externalCompId: string;
	externalDivId: string;
}

export interface ICompetitionFormFieldsServerSide extends Omit<ICompetition_Root, "_id"> {
	externalCompId: number | null;
	externalDivId: number | null;
}

//Schema
const CompetitionSchema = new Schema<ICompetition_Mongoose>({
	name: { type: String, required: true },
	hashtagPrefix: { type: String, required: true },
	competitionHashtag: { type: String, default: null },
	image: { type: String, required: true },
	isFavourite: { type: Boolean, default: false },
	externalCompId: { type: Number },
	externalDivId: { type: Number }
});

//Assign to mongoose
export const Competition = mongoose.model<ICompetition_Mongoose>("competitions", CompetitionSchema);
