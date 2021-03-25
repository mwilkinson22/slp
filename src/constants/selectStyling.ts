import { CSSProperties } from "react";
import { ControlProps, OptionProps, StylesConfig } from "react-select";

type optionType = Record<string, any>;
export const selectStyling: StylesConfig<optionType, false> = {
	option: (provided: CSSProperties, state: OptionProps<optionType, false>) => ({
		...provided,
		background: state.isSelected ? "#8f1717" : state.isFocused ? "#e3c5c5" : "transparent",
		":active": {
			backgroundColor: "#8f17174d"
		},
		color: state.isSelected ? "#FFF" : "#000"
	}),
	control: (provided: CSSProperties, state: ControlProps<optionType, false>) => ({
		...provided,
		borderColor: state.isFocused || state.isFocused ? "#8f1717" : "#DDD",
		boxShadow: "transparent",
		"&:hover": {
			borderColor: "#8f1717"
		},
		"&:not(:focus):hover": {
			borderColor: "#BBB"
		}
	}),
	menu: (provided: CSSProperties) => ({
		...provided,
		marginTop: 0,
		zIndex: 20
	})
};
