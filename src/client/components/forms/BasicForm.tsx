//Modules
import _ from "lodash";
import React, { Component, ComponentType, ReactNode } from "react";
import { withRouter, Prompt, RouteComponentProps } from "react-router-dom";
import { Formik, Form, FormikHelpers, FormikProps, FormikErrors, FormikTouched } from "formik";
import { diff } from "deep-object-diff";
import { ObjectSchema } from "yup";

//Components
import { ErrorBoundary } from "~/client/components/hoc/ErrorBoundary";
import { DeleteButtons } from "./DeleteButtons";

//Enums
import { FormFieldTypes, IFieldAny, IFieldGroup, IFormikValuesObject } from "~/enum/FormFieldTypes";

//Helpers
import { extractYupData, renderFieldGroup, getTouchedNestedErrors } from "~/helpers/formHelper";

//Interfaces
export interface IPassedProps<T, O = any> {
	alterValuesBeforeSubmit?: (values: T) => T | void;
	fastFieldByDefault?: boolean;
	fieldGroups: IFieldGroup<T>[] | ((values: T) => IFieldGroup<T>[]);
	formClassName?: string;
	includeResetButton?: boolean;
	initialValues: T;
	isInitialValid?: boolean;
	isNew: boolean;
	itemType: string;
	onDelete?: () => any;
	onReset?: () => any;
	onSubmit: (values: any, formikProps: FormikHelpers<T>) => any;
	preventFormUpdate?: boolean;
	promptOnExit?: boolean;
	redirectOnDelete?: string;
	redirectOnSubmit?: string | ((returnedObject: O, originalValues: T) => string | false);
	showErrorSummary?: boolean;
	submitButtonText?: string;
	testMode?: boolean;
	useCard?: boolean;
	useGrid?: boolean;
	validationSchema: ObjectSchema;
}
interface IProps<T, O> extends IPassedProps<T, O>, RouteComponentProps {}
interface IState<T, O> {
	fieldGroups: IProps<T, O>["fieldGroups"];
	initialValues: IProps<T, O>["initialValues"];
	isNew: IProps<T, O>["isNew"];
	validationSchema: IProps<T, O>["validationSchema"];
}

//Component
class _BasicForm<T extends IFormikValuesObject, O> extends Component<IProps<T, O>, IState<T, O>> {
	constructor(props: IProps<T, O>) {
		super(props);

		if (props.testMode) {
			console.info("Form loaded in test mode");
		}

		this.state = _.pick(props, ["fieldGroups", "initialValues", "isNew", "validationSchema"]);
	}

	static getDerivedStateFromProps<T, O>(nextProps: IProps<T, O>) {
		return _.pick(nextProps, ["fieldGroups", "initialValues", "isNew", "validationSchema"]);
	}

	/**
	 * Gets our field groups, whether they're passed in as an object or a callback
	 *
	 */
	getFieldGroups(values: T): IFieldGroup<T>[] {
		const { fieldGroups } = this.props;
		if (typeof fieldGroups === "function") {
			return fieldGroups(values);
		} else {
			return fieldGroups;
		}
	}

	/**
	 * Ensure all fieldgroup options are valid
	 * We pass in the values in case they're required in props.getFieldGroups
	 */
	validateFieldGroups(values: T): void {
		const fieldGroups = this.getFieldGroups(values);

		_.chain(fieldGroups)
			.filter("fields")
			.map("fields")
			.flatten()
			.each(field => {
				let error;
				switch (field.type) {
					case FormFieldTypes.radio:
					case FormFieldTypes.select: {
						if (!field.options) {
							error = `Field of type ${field.type} must have an options property`;
						}
						break;
					}
					case FormFieldTypes.asyncSelect: {
						if (!field.loadOptions) {
							error = `Field of type ${field.type} must have a loadOptions property`;
						}
						break;
					}
				}

				if (error) {
					console.error(error, field);
				}
			})
			.value();
	}

	/**
	 * Standardise values before we call onSubmit.
	 * It is only called for fieldGroup.fields, never for fieldGroup.render.
	 *
	 * @param values At first the standard formik values object, but this can then
	 * be called recursively for nested objects and arrays
	 * @param fields The combined fieldGroup.fields values as an object
	 * @param parentPath If called recursively, this gives us the parent elements already processed
	 * @param isArray Tells us whether values is an array
	 *
	 * So if we had a form with the following values:
	 * { name: { first: "John", last: "Smith" }, age: 23, hobbies: ["Football", "Chess"]}
	 *
	 * We'd call this method 3 times on submit
	 * 1. processValues(valuesAsAbove, fieldGroup.fields, [], false)
	 * 2. processValues(valuesAsAbove.name, fieldGroup.fields, ["name"], false }
	 * 3. processValues(valuesAsAbove.hobbies, fieldGroup.fields, ["hobbies"], true }
	 *
	 * @return an object in the format we need it. Handles nested properties and arrays, pulls off the
	 * select values and converts empty strings/numbers to null
	 *
	 */
	processValues(
		values: Record<string, any> | any[],
		fields: _.Dictionary<IFieldAny<T>>,
		parentPath: string[] = [],
		isArray: boolean = false
	) {
		const callback = (val: any, key: string): any => {
			//First we determine whether there is a field by this name
			let field;
			if (isArray) {
				field = fields[parentPath.join(".")];
			} else {
				field = fields[[...parentPath, key].join(".")];
			}

			//Convert value
			let newValue;
			if (Array.isArray(val)) {
				//For arrays, go recursive, with isArray set to true
				newValue = this.processValues(val, fields, [...parentPath, key], true);
			} else if (typeof val === "object") {
				//For objects, we check for select fields
				const isSelect =
					field && [FormFieldTypes.asyncSelect, FormFieldTypes.creatableSelect].indexOf(field.type) > -1;

				if (isSelect) {
					//If it's a creatable or async select, we pull off the value
					newValue = val.value;
				} else {
					//Otherwise, we go recursive
					newValue = this.processValues(val, fields, [...parentPath, key]);
				}
			} else {
				//For any non-object/array fields, simply return the value as is
				newValue = val;
			}

			return newValue == null || newValue.length === 0 ? null : newValue;
		};

		if (isArray) {
			return _.map(values, callback) as any[];
		} else {
			return _.mapValues(values, callback) as T;
		}
	}

	async handleSubmit(fValues: T, formikProps: FormikHelpers<T>) {
		const { alterValuesBeforeSubmit, history, onSubmit, redirectOnSubmit, testMode } = this.props;

		//Get the field groups for validation
		const fieldGroups = this.getFieldGroups(fValues);

		//Get flat field list
		// Record<IFieldAny<T>["name"], IFieldAny<T>>
		const fields = _.chain(fieldGroups).map("fields").flatten().keyBy("name").value();

		//Process values (pull value from select fields, convert empty strings to null, etc)
		let values = this.processValues(_.cloneDeep(fValues), fields);

		//Technically as far as typescript is concerned, values could be an array.
		//In practice it won't be, as processValues() isArray param will always be false.
		//Still, to prevent errors we confirm it's not an array before running alterValuesBeforeSubmit.

		//Custom callback to manipulate values before submitting
		if (alterValuesBeforeSubmit && !Array.isArray(values)) {
			const newValues = alterValuesBeforeSubmit(values);
			//Most of the time we just manipulate the object without
			//returning anything from this method.
			//When we do return, we assign the returned value here
			if (newValues) {
				values = newValues;
			}
		}

		//Submit
		if (testMode) {
			console.info("Test outcome: ", values);
		} else {
			const result = await onSubmit(values, formikProps);

			//Redirect
			if (typeof redirectOnSubmit === "function" && result) {
				const redirectPage = redirectOnSubmit(result, fValues);
				if (redirectPage) {
					history.push(redirectPage);
				}
			} else if (typeof redirectOnSubmit === "string") {
				history.push(redirectOnSubmit);
			}

			//Required in case the submit is unsuccessful
			formikProps.setSubmitting(false);
		}
	}

	async handleDelete() {
		const { history, onDelete, redirectOnDelete, testMode } = this.props;

		if (onDelete && !testMode) {
			const success = await onDelete();

			if (success === undefined) {
				console.error("Delete action returned undefined. It should return true or false.");
			}

			if (success && redirectOnDelete) {
				history.replace(redirectOnDelete);
			}
		}
	}

	renderFields(values: T, formikProps: FormikProps<T>): ReactNode[] {
		const { fastFieldByDefault, testMode } = this.props;
		const { validationSchema } = this.state;
		const fieldGroups = this.getFieldGroups(values);

		//Validate
		this.validateFieldGroups(values);

		//Log in test mode
		if (testMode) {
			console.info("Values", values);
			console.info("Field Groups", fieldGroups);
			if (Object.keys(formikProps.errors).length) {
				console.info("Errors", formikProps.errors);
			}
		}

		return _.flatten(
			fieldGroups.map((fieldGroup: IFieldGroup<T>, i: number) => {
				const content = [];

				if (fieldGroup.label) {
					content.push(<h6 key={`label-${i}`}>{fieldGroup.label}</h6>);
				}

				if ("render" in fieldGroup) {
					//Custom Render
					content.push(fieldGroup.render(values, formikProps));
				} else if (fieldGroup.fields) {
					//Standard fields
					//Remove anything with the hide flag, and then set the property to undefined
					const fields = fieldGroup.fields
						.filter((f: IFieldAny<T>) => !f.hide)
						.map((f: IFieldAny<T>) => ({ ...f, hide: undefined }));
					content.push(renderFieldGroup(fields, validationSchema, fastFieldByDefault));
				}

				return content;
			})
		);
	}

	renderErrors(nestedErrors: FormikErrors<T>, nestedTouched: FormikTouched<T>) {
		const { showErrorSummary, validationSchema } = this.props;

		if (showErrorSummary) {
			const errors = getTouchedNestedErrors(nestedErrors, nestedTouched);

			if (Object.keys(errors).length) {
				const errorList = Object.keys(errors).map(name => {
					const yupField = extractYupData(name, validationSchema);
					const label = yupField && yupField.label ? yupField.label : name;
					return <li key={name}>{label}</li>;
				});
				return (
					<div className="error">
						<strong>The following fields have errors:</strong>
						<ul>{errorList}</ul>
					</div>
				);
			}
		}
	}

	renderSubmitButtons(formHasChanged: boolean, isSubmitting: boolean) {
		const { includeResetButton, isInitialValid, itemType } = this.props;
		let { submitButtonText } = this.props;
		const { isNew } = this.state;

		if (!submitButtonText) {
			if (isSubmitting) {
				if (isNew) {
					submitButtonText = "Adding";
				} else {
					submitButtonText = "Updating";
				}
			} else {
				if (isNew) {
					submitButtonText = "Add";
				} else {
					submitButtonText = "Update";
				}
			}
			submitButtonText += ` ${itemType}`;
		}

		const disableButtons = (!formHasChanged && !isInitialValid) || isSubmitting;

		let resetButton;
		if (includeResetButton) {
			resetButton = (
				<button type="reset" disabled={disableButtons}>
					Reset
				</button>
			);
		}

		return (
			<div className="buttons">
				{resetButton}
				<button type="submit" className={disableButtons ? "" : "confirm"} disabled={disableButtons}>
					{submitButtonText}
				</button>
			</div>
		);
	}

	renderDeleteButtons() {
		const { onDelete } = this.props;
		if (onDelete) {
			return (
				<div className="card form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	render() {
		const { formClassName, isInitialValid, onReset, promptOnExit, useCard, useGrid } = this.props;
		const { initialValues, validationSchema } = this.state;

		const classNames = ["form-card"];

		if (useCard) {
			classNames.push("card");
		}

		if (formClassName) {
			classNames.push(formClassName);
		}

		if (useGrid) {
			classNames.push("grid");
		}

		return (
			<Formik<T>
				enableReinitialize={true}
				isInitialValid={isInitialValid}
				initialValues={initialValues}
				onReset={onReset}
				onSubmit={(values: T, formikProps: FormikHelpers<T>) => this.handleSubmit(values, formikProps)}
				validationSchema={validationSchema}
				render={formikProps => {
					const { errors, initialValues, values, touched, isSubmitting } = formikProps;

					const formHasChanged = Object.keys(diff(values, initialValues)).length > 0;
					return (
						<Form>
							<Prompt
								when={promptOnExit && !isSubmitting && formHasChanged}
								message="You have unsaved changes. Are you sure you want to navigate away?"
							/>
							<div className={classNames.join(" ")}>
								{this.renderFields(values, formikProps)}
								{this.renderErrors(errors, touched)}
								{this.renderSubmitButtons(formHasChanged, isSubmitting)}
							</div>
							{this.renderDeleteButtons()}
						</Form>
					);
				}}
			/>
		);
	}
}

export class BasicForm<T, O = any> extends Component<IPassedProps<T, O>, IState<T, O>> {
	static defaultProps = {
		fastFieldByDefault: true,
		includeResetButton: true,
		isInitialValid: false,
		promptOnExit: true,
		redirectOnDelete: `/admin/`,
		showErrorSummary: true,
		testMode: false,
		useCard: true,
		useGrid: true
	};

	shouldComponentUpdate(nextProps: Readonly<IPassedProps<T, O>>): boolean {
		const { preventFormUpdate } = nextProps;
		//If we pass in preventFormUpdate={true}, then the form won't re-render on new props.
		//This allows us to use the multi-add functionality on GamePage.
		//It will be ignored if we don't want to multi-add as the redirect will force
		//a re-render in the parent
		return !preventFormUpdate;
	}

	render() {
		return (
			<ErrorBoundary>
				{React.createElement(withRouter(_BasicForm as ComponentType<IProps<T, O>>), this.props)}
			</ErrorBoundary>
		);
	}
}
