import React from "react";

interface IProps {
	name: string;
	value: boolean;
	onChange: () => any;
	onBlur?: () => any;
}

export function BooleanSlider(PassedProps: IProps) {
		const { value, ...props} = PassedProps;
		const { name } = props;
		return (
			<div className="boolean">
				<input
					{...props}
					name={name}
					defaultChecked={value}
					type="checkbox"
					className="boolean-checkbox"
					id={`bool-${name}`}
				/>
				<label className="boolean-slider" htmlFor={`bool-${name}`} />
			</div>
		);
}
