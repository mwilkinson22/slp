import React, { Component } from "react";
import { SelectOption } from "~/enum/FormFieldTypes";

interface IProps {
	name: string;
	value: string;
	options: SelectOption[];
	onChange: () => any;
	onBlur?: () => any;
}

export class RadioButtons extends Component<IProps> {
	render() {
		const { name, options } = this.props;
		const fields = options.map(option => {
			const id = `${name}-${option.value}`;
			return [
				<input
					key="input"
					type="radio"
					id={id}
					{...this.props}
					value={option.value}
					defaultChecked={this.props.value === option.value}
				/>,
				<label key="label" htmlFor={id}>
					<span className="radio-button" />
					{option.label}
				</label>
			];
		});
		return (
			<div key={name} className="radio-fields">
				{fields}
			</div>
		);
	}
}
