//Modules
import _ from "lodash";
import React, { Component, ReactNode } from "react";
import { withRouter, Prompt, RouteComponentProps } from "react-router-dom";
import { Formik, Form, FormikHelpers, FormikProps } from "formik";
import { diff } from "deep-object-diff";
import { ObjectSchema } from "yup";

//Components
import { DeleteButtons } from "./DeleteButtons";

//Enums
import { FormFieldTypes, IFieldGroup, IFormikValues } from "~/enum/FormFieldTypes";

//Helpers
import { extractYupData, renderFieldGroup, getTouchedNestedErrors } from "~/helpers/formHelper";

//Interfaces
interface IProps extends RouteComponentProps {
	alterValuesBeforeSubmit?: (values: IFormikValues) => IFormikValues | void;
	fastFieldByDefault?: boolean;
	fieldGroups: IFieldGroup[] | ((values: IFormikValues) => IFieldGroup[]);
	formClassName?: string;
	includeResetButton?: boolean;
	initialValues: IFormikValues;
	isInitialValid?: boolean;
	isNew: boolean;
	itemType: string;
	onDelete?: () => any;
	onReset?: () => any;
	onSubmit: (values: any, formikProps: FormikHelpers<IFormikValues>) => any;
	promptOnExit?: boolean;
	redirectOnDelete?: string;
	redirectOnSubmit?: string | ((returnedObject: IFormikValues, originalValues: IFormikValues) => string | false);
	showErrorSummary?: boolean;
	submitButtonText?: string;
	testMode?: boolean;
	useCard?: boolean;
	useGrid?: boolean;
	validationSchema: ObjectSchema;
}
interface IState {
	fieldGroups: IProps["fieldGroups"];
	initialValues: IProps["initialValues"];
	isNew: IProps["isNew"];
	validationSchema: IProps["validationSchema"];
}

//Component
class _BasicForm extends Component<IProps, IState> {
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

	constructor(props: IProps) {
		super(props);

		if (props.testMode) {
			console.info("Form loaded in test mode");
		}

		this.state = _.pick(props, ["fieldGroups", "initialValues", "isNew", "validationSchema"]);
	}

	static getDerivedStateFromProps(nextProps: IProps) {
		return _.pick(nextProps, ["fieldGroups", "initialValues", "isNew", "validationSchema"]);
	}

	getFieldGroups(values: IFormikValues): IFieldGroup[] {
		const { fieldGroups } = this.props;
		if (typeof fieldGroups === "function") {
			return fieldGroups(values);
		} else {
			return fieldGroups;
		}
	}

	validateFieldGroups(values: IFormikValues): void {
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

	processValues(values: IFormikValues, fields: IFormikValues, parentPath: string[] = [], isArray: boolean = false) {
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
			return _.map(values, callback);
		} else {
			return _.mapValues(values, callback);
		}
	}

	async handleSubmit(fValues: IFormikValues, formikProps: FormikHelpers<IFormikValues>) {
		const { alterValuesBeforeSubmit, history, onSubmit, redirectOnSubmit, testMode } = this.props;

		const fieldGroups = this.getFieldGroups(fValues);

		//Get flat field list
		const fields = _.chain(fieldGroups).map("fields").flatten().keyBy("name").value();

		//Process values (pull value from select fields, convert empty strings to null, etc)
		let values = this.processValues(_.cloneDeep(fValues), fields);

		//Custom callback to manipulate values before submitting
		if (alterValuesBeforeSubmit) {
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

	renderFields(values: IFormikValues, formikProps: FormikProps<IFormikValues>): ReactNode[] {
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
			fieldGroups.map((fieldGroup: IFieldGroup, i: number) => {
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
					const fields = fieldGroup.fields.filter(f => !f.hide).map(f => ({ ...f, hide: undefined }));
					content.push(renderFieldGroup(fields, validationSchema, fastFieldByDefault));
				}

				return content;
			})
		);
	}

	renderErrors(nestedErrors: IFormikValues, nestedTouched: IFormikValues) {
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
			<Formik
				enableReinitialize={true}
				isInitialValid={isInitialValid}
				initialValues={initialValues}
				onReset={onReset}
				onSubmit={(values, formikProps) => this.handleSubmit(values, formikProps)}
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

export const BasicForm = withRouter(_BasicForm);
