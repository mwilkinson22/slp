import React, { Component } from "react";

interface IProps {
	onDelete: () => any;
	deleteText: string;
}

interface IState {
	promptClicked: boolean;
}

export class DeleteButtons extends Component<IProps, IState> {
	static defaultProps = {
		deleteText: "Delete"
	}
	state = { promptClicked: false };

	render() {
		const { promptClicked } = this.state;
		const { deleteText } = this.props;


		let buttons;
		if (promptClicked) {
			buttons = [
				<button
					type="button"
					key="cancel"
					onClick={() => this.setState({ promptClicked: false })}
				>
					Cancel
				</button>,
				<button
					type="button"
					className="delete"
					key="confirm"
					onClick={() => {
						this.setState({ promptClicked: false });
						this.props.onDelete();
					}}
				>
					Confirm
				</button>
			];
		} else {
			buttons = (
				<button
					type="button"
					className="delete"
					onClick={() => this.setState({ promptClicked: true })}
				>
					{deleteText || "Delete"}
				</button>
			);
		}
		return <div className="buttons">{buttons}</div>;
	}
}
