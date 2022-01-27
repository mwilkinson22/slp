import React from "react";

interface IProps {
	name: string;
	value: boolean;
	disabled?: boolean;
	onChange: () => any;
	onBlur?: () => any;
}

export function BooleanSlider(PassedProps: IProps) {
	const { value, ...props } = PassedProps;
	const { disabled, name } = props;

	return (
		<div className={`boolean${disabled ? " read-only" : ""}`}>
			<input
				{...props}
				name={name}
				checked={value}
				type="checkbox"
				className="boolean-checkbox"
				id={`bool-${name}`}
			/>

			<label className="boolean-slider" htmlFor={`bool-${name}`} />
		</div>
	);
}
