import { ReactNode } from "react";
import { FieldArrayRenderProps, FieldProps, FormikProps } from "formik";

import { ImageFieldProps } from "~/client/components/forms/fields/ImageField";
import { ObjectToDot } from "~/helpers/genericHelper";

export enum FormFieldTypes {
	//Standard HTML Inputs
	colour = "color",
	date = "date",
	number = "number",
	password = "password",
	time = "time",
	textarea = "textarea",
	text = "text",

	//Custom Components
	boolean = "boolean",
	radio = "radio",
	select = "select",
	creatableSelect = "creatableSelect", //accepts custom showDropdown boolean prop
	asyncSelect = "asyncSelect",

	//Maps into Formik's fieldArray component, requires a render method
	fieldArray = "fieldArray",

	//Image Uploader
	image = "image",

	//Tweet Composer
	tweet = "tweet"
}

interface IField<T extends Record<string, any>> {
	name: ObjectToDot<T>;
	type: FormFieldTypes;
	key?: string;
	label?: string;
	fastField?: boolean;
	customOnChange?: (value: any, formik?: FieldProps) => void;
	min?: number | Date;
	max?: number | Date;
	hide?: boolean;
	step?: number;
	placeholder?: string;
	disabled?: boolean;
}

export interface IFieldBasic<T> extends IField<T> {
	type:
		| FormFieldTypes.colour
		| FormFieldTypes.date
		| FormFieldTypes.number
		| FormFieldTypes.password
		| FormFieldTypes.time
		| FormFieldTypes.textarea
		| FormFieldTypes.text
		| FormFieldTypes.boolean;
}

export interface IField_Array<T> extends IField<T> {
	type: FormFieldTypes.fieldArray;
	render: (renderProps: FieldArrayRenderProps) => ReactNode;
}

export interface SelectOption {
	label: string;
	value: any;
}

export interface SelectOptionGroup {
	label: string;
	options: SelectOption[];
}

export interface IField_Radio<T> extends IField<T> {
	type: FormFieldTypes.radio;
	options: SelectOption[];
}

interface IField_Select_Root<T> extends IField<T> {
	type: FormFieldTypes.select | FormFieldTypes.creatableSelect | FormFieldTypes.asyncSelect;
	options: (SelectOption | SelectOptionGroup)[];
	isMulti?: boolean;
	isClearable?: boolean;
	isSearchable?: boolean;
	closeMenuOnSelect?: boolean;
	showDropdown?: boolean;
}

export interface IField_Select<T> extends IField_Select_Root<T> {
	type: FormFieldTypes.select | FormFieldTypes.creatableSelect;
}

export interface IField_AsyncSelect<T> extends IField_Select_Root<T> {
	type: FormFieldTypes.asyncSelect;
	loadOptions: () => { label: string; value: string };
}

export interface IField_Image<T> extends IField<T> {
	acceptSVG?: ImageFieldProps["acceptSVG"];
	dependentCheck?: ImageFieldProps["dependentCheck"];
	path: ImageFieldProps["path"];
	resize?: ImageFieldProps["resize"];
	sizeForSelector?: ImageFieldProps["sizeForSelector"];
	type: FormFieldTypes.image;
}

export interface IField_Tweet<T> extends IField<T> {
	type: FormFieldTypes.tweet;
	calculateLength?: boolean;
	variables?: SelectOption[];
	variableInstruction?: string;
}

export type IFieldAny<T> =
	| IFieldBasic<T>
	| IField_Array<T>
	| IField_Radio<T>
	| IField_Select<T>
	| IField_AsyncSelect<T>
	| IField_Image<T>
	| IField_Tweet<T>;

type FieldGroupWithFields<T> = {
	fields: IFieldAny<T>[];
	label?: string;
};
type FieldGroupWithRenderMethod<T> = {
	render: (values: T, formik: FormikProps<T>) => ReactNode;
	label?: string;
};

export type IFieldGroup<T> = FieldGroupWithFields<T> | FieldGroupWithRenderMethod<T>;

export type IFormikValuesObject = Record<string, any>;
