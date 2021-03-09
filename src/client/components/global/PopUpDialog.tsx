import React, { Component, ReactNode } from "react";

//Interfaces & Types
export type OnPopupDialogDestroy = () => void;
interface IProps {
	asCard: boolean;
	asGrid: boolean;
	children: ReactNode;
	clickBackgroundToClose: boolean;
	className?: string;
	closeButtonText?: string;
	fullSize: boolean;
	onDestroy: OnPopupDialogDestroy;
}

export class PopUpDialog extends Component<IProps> {
	static defaultProps = {
		asCard: true,
		asGrid: false,
		fullSize: false,
		clickBackgroundToClose: true,
		closeButtonText: null
	};

	handleBackgroundClick(ev: React.MouseEvent) {
		const { clickBackgroundToClose, onDestroy } = this.props;

		if (clickBackgroundToClose && ev.target === ev.currentTarget) {
			onDestroy();
		}
	}
	render() {
		const { asCard, asGrid, children, className, fullSize, closeButtonText, onDestroy } = this.props;

		const dialogClassName = ["pop-up-dialog"];

		if (asCard) {
			dialogClassName.push("form-card");
			if (asGrid) {
				dialogClassName.push("grid");
			}
		}
		if (fullSize) {
			dialogClassName.push("full-size");
		}
		if (className) {
			dialogClassName.push(className);
		}

		return (
			<div className="pop-up-dialog-bg" onClick={ev => this.handleBackgroundClick(ev)}>
				<div className={dialogClassName.join(" ")}>
					{children}
					{closeButtonText && (
						<div className="buttons">
							<button type="button" onClick={() => onDestroy()}>
								{closeButtonText}
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}
}
