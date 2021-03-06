//Modules
import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

//Interfaces
interface IUser_Root {
	_id: string | Types.ObjectId;
	username: string;
	password: string;
	name: {
		first: string;
		last: string;
	};
	isAdmin: boolean;
}
export interface IUser extends IUser_Root {
	_id: string;
}
export interface IUser_Mongoose extends IUser_Root, Document {
	_id: IUser_Root["_id"];
	generateHash(password: string): string;
	validatePassword(password: string): boolean;
}

//Schema
const UserSchema = new Schema<IUser_Mongoose>({
	username: { type: String, unique: true },
	password: { type: String, required: true },
	name: {
		first: { type: String, required: true },
		last: { type: String, required: true }
	},
	isAdmin: { type: Boolean, default: false }
});

//Password methods
UserSchema.methods.generateHash = function (password: string): string {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};
UserSchema.methods.validatePassword = function (password: string): boolean {
	return bcrypt.compareSync(password, this.password);
};

//Assign to mongoose
export const User = mongoose.model<IUser_Mongoose>("users", UserSchema);
