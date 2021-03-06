//Modules
import mongoose, { Schema, Document } from "mongoose";
const bcrypt = require("bcryptjs");

//Interfaces
export interface IUser extends Document {
	username: string;
	password: string;
	name: {
		first: string;
		last: string;
	};
	isAdmin: boolean;
}
export interface IUser_Mongoose extends IUser {
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
UserSchema.methods.generateHash = function(password: string): string {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
UserSchema.methods.validatePassword = function(password: string): boolean {
	return bcrypt.compareSync(password, this.password);
};

//Assign to mongoose
export const User = mongoose.model<IUser_Mongoose>("users", UserSchema);
