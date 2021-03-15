import { ReactNode } from "react";
import { FieldArrayRenderProps, FieldProps, FormikProps } from "formik";

import { ImageFieldProps } from "~/client/components/forms/fields/ImageField";

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
	image = "image"
}

interface IField {
	name: string;
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

export interface IFieldBasic extends IField {
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

export interface IField_Array extends IField {
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

export interface IField_Radio extends IField {
	type: FormFieldTypes.radio;
	options: SelectOption[];
}

interface IField_Select_Root extends IField {
	type: FormFieldTypes.select | FormFieldTypes.creatableSelect | FormFieldTypes.asyncSelect;
	options: (SelectOption | SelectOptionGroup)[];
	isMulti?: boolean;
	isClearable?: boolean;
	closeMenuOnSelect?: boolean;
	showDropdown?: boolean;
}

export interface IField_Select extends IField_Select_Root {
	type: FormFieldTypes.select | FormFieldTypes.creatableSelect;
}

export interface IField_AsyncSelect extends IField_Select_Root {
	type: FormFieldTypes.asyncSelect;
	loadOptions: () => { label: string; value: string };
}

export interface IField_Image extends IField {
	acceptSVG?: ImageFieldProps["acceptSVG"];
	dependentCheck?: ImageFieldProps["dependentCheck"];
	path: ImageFieldProps["path"];
	resize?: ImageFieldProps["resize"];
	sizeForSelector?: ImageFieldProps["sizeForSelector"];
	type: FormFieldTypes.image;
}

export type IFieldAny = IFieldBasic | IField_Array | IField_Radio | IField_Select | IField_AsyncSelect | IField_Image;

type FieldGroupWithFields = {
	fields: IFieldAny[];
	label?: string;
};
type FieldGroupWithRenderMethod = {
	render: (values: IFormikValues, formik?: FormikProps<IFormikValues>) => ReactNode;
	label?: string;
};

export type IFieldGroup = FieldGroupWithFields | FieldGroupWithRenderMethod;

export type IFormikValues<T = any> = { [key: string]: T };
