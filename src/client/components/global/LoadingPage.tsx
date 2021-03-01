import React, { CSSProperties } from "react";

interface IProps {
	fullpage?: boolean;
}

export function LoadingPage(props: IProps) {
	const style: CSSProperties = {};
	if (props.fullpage) {
		style.height = "70vh";
	}
	return (
		<div style={style}>
			<div className="loading-spinner" />
		</div>
	);
}
