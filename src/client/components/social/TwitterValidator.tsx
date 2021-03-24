//Modules
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";
import { ISettings } from "~/models/Settings";

//Actions
import { TwitterValidationResult, validateTwitterApp } from "~/client/actions/socialActions";

//Redux
const connector = connect(null, { validateTwitterApp });

interface IProps extends ConnectedProps<typeof connector> {
	values: ISettings["twitterApp"];
}
interface IState {
	isLoading: boolean;
	validationResult?: TwitterValidationResult;
	values: IProps["values"];
}

class _TwitterValidator extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		this.state = { isLoading: false, values: props.values };
	}

	static getDerivedStateFromProps(nextProps: IProps): Partial<IState> {
		return { values: nextProps.values };
	}

	validate() {
		const { validateTwitterApp } = this.props;
		const { values } = this.state;
		this.setState({ isLoading: true, validationResult: undefined });
		validateTwitterApp(values).then(validationResult => this.setState({ validationResult }));
		this.setState({ isLoading: false });
	}

	renderValidationResult() {
		const { validationResult } = this.state;
		if (!validationResult) {
			return;
		}

		if (validationResult.authenticated) {
			return `Succesfully authenticated as @${validationResult.user}!`;
		} else {
			return `Authentication failed: ${validationResult.error.toString()}`;
		}
	}

	render() {
		const { isLoading, values } = this.state;
		return (
			<div className="buttons" key="validation">
				<button
					type="button"
					onClick={() => this.validate()}
					disabled={isLoading || Object.values(values).filter(s => !s.length).length > 0}
				>
					Test These Credentials
				</button>
				{this.renderValidationResult()}
			</div>
		);
	}
}

export const TwitterValidator = connector(_TwitterValidator);
