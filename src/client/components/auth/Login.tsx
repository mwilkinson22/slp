//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import * as Yup from "yup";

//Components
import { BasicForm } from "../forms/BasicForm";

//Enums
import { FormFieldTypes, IFieldGroup, IFormikValues } from "~/enum/FormFieldTypes";

//Actions
import { login, LoginParams } from "../../actions/userActions";
import { SiteLogo } from "~/client/components/images/SiteLogo";

//Interfaces
interface IProps extends ConnectedProps<typeof connector> {}
interface IState {
	loginHasFailed: boolean;
	validationSchema: Yup.ObjectSchema;
}

//Redux
const connector = connect(null, { login });

class _Login extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		this.state = {
			loginHasFailed: false,
			validationSchema: Yup.object().shape({
				username: Yup.string().required().label("Username"),
				password: Yup.string().required().label("Password")
			})
		};
	}

	getInitialValues() {
		return {
			username: "",
			password: ""
		};
	}

	getFieldGroups(): IFieldGroup[] {
		const { loginHasFailed } = this.state;
		const fields: IFieldGroup[] = [
			{
				fields: [
					{ name: "username", type: FormFieldTypes.text },
					{ name: "password", type: FormFieldTypes.password }
				]
			}
		];

		if (loginHasFailed) {
			fields.push({
				render: () => (
					<p className="error" key="error">
						Invalid credentials, please try again
					</p>
				)
			});
		}
		return fields;
	}

	async handleSubmit(values: IFormikValues) {
		this.setState({ loginHasFailed: false });

		const result = await this.props.login(values as LoginParams);

		if (!result) {
			this.setState({ loginHasFailed: true });
		}
	}

	render() {
		const { validationSchema } = this.state;
		return (
			<section className="login-page">
				<div className="container">
					<div className="card login-card">
						<SiteLogo withShadow={true} />
						<BasicForm
							fieldGroups={this.getFieldGroups()}
							includeResetButton={false}
							initialValues={this.getInitialValues()}
							itemType="User"
							isNew={false}
							onSubmit={(values: IFormikValues) => this.handleSubmit(values)}
							showErrorSummary={false}
							submitButtonText={"Log In"}
							useCard={false}
							validationSchema={validationSchema}
						/>
					</div>
				</div>
			</section>
		);
	}
}

export const Login = connector(_Login);
