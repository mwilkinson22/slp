//Modules
import _ from "lodash";
import React from "react";
import { ErrorMessage, FastField, Field, FieldArray, FieldProps } from "formik";
import Select, { Props as ReactSelectProps } from "react-select";
import AsyncSelect from "react-select/async";
import CreatableSelect from "react-select/creatable";
import * as Yup from "yup";

//Input Components
import { BooleanSlider } from "~/client/components/forms/fields/BooleanSlider";
import { RadioButtons } from "~/client/components/forms/fields/RadioButtons";
import { ImageField } from "~/client/components/forms/fields/ImageField";
import { TweetComposer } from "~/client/components/social/TweetComposer";

//Enums, Types & Interfaces
import { FormFieldTypes, IFieldAny, IFormikValuesObject, SelectOption, SelectOptionGroup } from "~/enum/FormFieldTypes";
import { KeyOfType } from "~/types/KeyOfType";

//Helpers
import { nestedObjectToDot } from "./genericHelper";
import { selectStyling } from "~/constants/selectStyling";

export function yupTweetValidator() {
	return Yup.string()
		.required()
		.test({
			name: "tweet-length",
			message: "Tweets cannot be longer than 280 characters",
			test: function (value) {
				if (value) {
					const { calculatedLength } = TweetComposer.formatContentAndGetLength(value);
					return calculatedLength <= 280;
				}
				return true;
			}
		});
}

type KeyOrFunction<T> = KeyOfType<T, string> | ((obj: T) => string);
export function convertRecordToSelectOptions<T extends { _id: string; isFavourite?: boolean }>(
	collection: Record<string, T>,
	display: KeyOrFunction<T>,
	settings: {
		sortBy?: KeyOrFunction<T>;
		filter?: (obj: T) => boolean;
		groupByFavourite?: boolean;
	} = {}
): Array<SelectOption | SelectOptionGroup> {
	const groupedOptions = _.chain(collection)
		.filter(i => {
			if (typeof settings.filter === "function") {
				return settings.filter(i);
			}
			return true;
		})
		//Work out if we need to group by favourites
		.groupBy(i => {
			if (settings.groupByFavourite === false) {
				return "All"; //This will be filtered out later on
			}
			return i.isFavourite ? "Favourites" : "Others";
		})
		.map((items, isFavourite) => {
			const options = _.chain(items)
				.map(object => {
					let label;

					//Get label
					if (typeof display === "function") {
						label = display(object);
					} else {
						label = object[display];
					}

					//Get sort value
					let sortValue;
					if (typeof settings.sortBy === "function") {
						sortValue = settings.sortBy(object);
					} else if (typeof settings.sortBy === "string") {
						sortValue = object[settings.sortBy];
					} else {
						//Default to label;
						sortValue = label;
					}

					//Check for favourite
					const isFavourite = settings.groupByFavourite === false ? false : object.isFavourite ?? false;

					return { value: object._id, label, sortValue, isFavourite };
				})
				.orderBy(["isFavourite", "sortValue"], ["desc", "asc"])
				.map(({ value, label }) => ({ value, label: label as string }))
				.value();
			return { label: isFavourite, options };
		})
		.sortBy("label")
		.value();

	if (groupedOptions.length > 1) {
		return groupedOptions;
	} else if (groupedOptions.length) {
		return groupedOptions[0].options;
	} else {
		return [];
	}
}

export function extractYupData(name: string, validationSchema: Yup.ObjectSchema) {
	return (
		name
			//Handle objects
			.split(".")
			.join(".fields.")
			//Handle arrays of objects
			.replace(/\.fields\.\d+\./g, ".innerType.")
			//Handle arrays of simple types
			.replace(/\.fields\.\d+$/g, ".innerType")
			//Convert to dot notation
			.split(".")
			.reduce((prev: any, curr: string) => (prev ? prev[curr] : null), validationSchema.describe().fields || self)
	);
}

export function renderFieldGroup<T extends IFormikValuesObject>(
	fields: IFieldAny<T>[],
	validationSchema: Yup.ObjectSchema,
	fastFieldByDefault: boolean = true
) {
	return fields.map(field => renderField<T>(field, validationSchema, fastFieldByDefault));
}
export function renderField<T extends IFormikValuesObject>(
	field: IFieldAny<T>,
	validationSchema: Yup.ObjectSchema,
	fastFieldByDefault: boolean = true
) {
	if (!validationSchema || !validationSchema.describe()) {
		throw new Error("Yup Validation Schema required");
	}

	if (field.type == FormFieldTypes.fieldArray) {
		const key = field.key || field.name + "-fieldArray";
		return <FieldArray name={field.name as string} render={field.render} key={key} />;
	} else {
		//Pull meta data from yup
		const yupField = extractYupData(field.name, validationSchema);

		if (!yupField) {
			throw new Error(`Field name '${field.name}' not found in validation schema`);
		}

		//Get Label
		field.label = field.label || yupField.label?.toString() || field.name;

		//Determine Required Status
		const tests = yupField.tests as any[];
		const required = Boolean(tests.find(test => test.name === "required"));

		//Get Min & Max
		const min = tests.find(test => test.name === "min");
		const max = tests.find(test => test.name === "max");
		if (min != null) {
			field.min = min.params.min;
		}
		if (max != null) {
			field.max = max.params.max;
		}

		//FastField eligibility
		if (field.fastField == null) {
			field.fastField = fastFieldByDefault;
		}

		//Get Label
		let label;
		if (field.label) {
			label = (
				<label key={`${field.name}-label`} className={required ? "required" : ""}>
					{field.label}
				</label>
			);
		}

		//Render Field Input
		const input = renderInput(field, required);

		//Error Message
		const error = (
			<span key={`${field.name}-error`} className="error">
				<ErrorMessage name={field.name as string} />
			</span>
		);

		return [label, input, error];
	}
}

export function renderInput<T extends IFormikValuesObject>(field: IFieldAny<T>, required?: boolean) {
	const { label, type, name, fastField, customOnChange, ...props } = field;

	if (!_.find(FormFieldTypes, t => t == type)) {
		throw new Error(`Invalid field type '${type}' supplied to renderField for field '${label}' `);
	}

	//Get Render Method
	const render = (formikProps: FieldProps<T>) => {
		const fieldName = field.name as string;
		//Update default onChange method for custom Select component
		switch (field.type) {
			case FormFieldTypes.select:
			case FormFieldTypes.creatableSelect:
				formikProps.field.onChange = (option: any) => {
					//Typescript expects a change event, but react-select
					//simply returns the selected object (or objects, for multiselect)
					//so we have to manually cast it here
					formikProps.form.setFieldTouched(fieldName, true);
					let value: string | string[] = "";
					if (field.isMulti) {
						const selectedOptions = option as SelectOption[];
						if (selectedOptions) {
							value = selectedOptions.map(o => o.value);
						}
					} else {
						const selectedOption = option as SelectOption;
						if (selectedOption) {
							value = selectedOption.value;
						}
					}
					formikProps.form.setFieldValue(fieldName, value);
				};
				break;
			case FormFieldTypes.asyncSelect:
			case FormFieldTypes.image:
			case FormFieldTypes.tweet:
				//See above - we have to call option as any and then cast it
				formikProps.field.onChange = (option: any) => {
					formikProps.form.setFieldTouched(fieldName, true);
					formikProps.form.setFieldValue(fieldName, option || "");
				};
				break;
		}

		//Wire in custom onChange
		//Mainly used to set unsavedChanges
		if (customOnChange) {
			const originalOnChange = formikProps.field.onChange;
			//See above - we have to call option as any and then cast it
			formikProps.field.onChange = (option: any) => {
				originalOnChange(option);
				customOnChange(option, formikProps);
			};
		}

		//We load in formikProps.field first, so we can overwrite
		//the default methods in the initial field object
		const mainProps: any = {
			...formikProps.field,
			...props
		};

		//Define additional react-select props
		switch (field.type) {
			case FormFieldTypes.select:
			case FormFieldTypes.asyncSelect:
			case FormFieldTypes.creatableSelect: {
				const selectProps: Partial<ReactSelectProps> = {};

				//Add classname
				const className = ["react-select"];
				if (mainProps.className) {
					className.push(mainProps.className);
				}
				selectProps.className = className.join(" ");

				//Add clearable status, if we haven't already
				selectProps.isClearable = mainProps.isClearable ?? !required;
				selectProps.isSearchable = mainProps.isSearchable ?? true;

				//Add to main props
				Object.assign(mainProps, selectProps);
			}
		}

		//Get the main component
		switch (field.type) {
			case FormFieldTypes.boolean:
				return <BooleanSlider {...mainProps} />;
			case FormFieldTypes.radio:
				return <RadioButtons {...mainProps} />;
			case FormFieldTypes.creatableSelect:
				if (field.showDropdown === false) {
					mainProps.components = { DropdownIndicator: () => null, Menu: () => null };
					delete mainProps.showDropdown;
				}

				if (mainProps.isMulti) {
					if (mainProps.value) {
						mainProps.value = mainProps.value.map((str: string) => ({
							value: str,
							label: str
						}));
					} else {
						mainProps.value = [];
					}
				} else {
					mainProps.value = { value: mainProps.value, label: mainProps.value };
				}
				return <CreatableSelect {...mainProps} value={mainProps.value || ""} styles={selectStyling} />;
			case FormFieldTypes.select: {
				let value: SelectOption | SelectOption[] | "";
				//Used to get value
				let flatOptions: SelectOption[];

				//Flatten Options if nested
				const isNested =
					mainProps.options.length && Object.prototype.hasOwnProperty.call(mainProps.options[0], "options");
				if (isNested) {
					const nestedOptions: SelectOptionGroup[] = mainProps.options;
					flatOptions = _.flatten(nestedOptions.map(o => o.options || o));
				} else {
					flatOptions = mainProps.options;
				}

				//Pull value from nested options
				if (mainProps.isMulti) {
					if (mainProps.value) {
						value = mainProps.value.map((valueInArray: string) =>
							flatOptions.find(({ value }) => value == valueInArray)
						);
					} else {
						value = [];
					}
				} else {
					value = flatOptions.find(({ value }) => value == mainProps.value) || "";
				}
				return <Select {...mainProps} value={value || ""} styles={selectStyling} />;
			}
			case FormFieldTypes.asyncSelect:
				return <AsyncSelect cacheOptions {...mainProps} styles={selectStyling} />;
			case FormFieldTypes.textarea:
				return <textarea className="form-textarea" rows={10} {...mainProps} />;
			case FormFieldTypes.image:
				return <ImageField {...mainProps} />;
			case FormFieldTypes.tweet:
				return <TweetComposer initialContent={mainProps.value} textContent={mainProps.value} {...mainProps} />;
			default:
				return <input {...mainProps} type={type} />;
		}
	};

	const fieldProps = {
		name,
		key: name
	};

	if (fastField) {
		return <FastField {...fieldProps}>{render}</FastField>;
	} else {
		return <Field {...fieldProps}>{render}</Field>;
	}
}

export function getTouchedNestedErrors(nestedErrors: any, nestedTouched: any) {
	//Convert from { address : { city: "" } } to { address.city: "" }
	const touched = nestedObjectToDot(nestedTouched);

	//Only log the touched errors
	const errors: { [key: string]: string } = {};
	_.each(nestedObjectToDot(nestedErrors), (err, key) => {
		if (touched[key]) {
			errors[key] = err;
		}
	});

	return errors;
}
