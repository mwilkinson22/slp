//Modules
import React, { Component, Fragment } from "react";
import { connect, ConnectedProps } from "react-redux";

//Components
import { FileUploader, FileUploaderProps } from "./FileUploader";

//Interfaces
import { StoreState } from "~/client/reducers";
import { FileSelector } from "~/client/components/forms/fields/FileSelector";
interface IProps extends ConnectedProps<typeof connector> {
	acceptSVG: boolean;
	dependentCheck: FileUploaderProps["dependentCheck"];
	onChange: FileUploaderProps["onComplete"];
	path: FileUploaderProps["path"];
	readOnly?: boolean;
	resize: FileUploaderProps["resize"];
	sizeForSelector?: string;
	value: string;
}
export interface ImageFieldProps extends IProps {}
interface IState {
	showImageSelector: boolean;
	showImageUploader: boolean;
}

//Redux
function mapStateToProps({ config }: StoreState) {
	const { bucketPaths } = config;
	return { bucketPaths };
}
const connector = connect(mapStateToProps);

class _ImageField extends Component<IProps, IState> {
	static defaultProps = {
		acceptSVG: true,
		readOnly: false,
		resize: {}
	};

	constructor(props: IProps) {
		super(props);

		this.state = { showImageSelector: false, showImageUploader: false };
	}

	renderImageSelector() {
		const { path, onChange, sizeForSelector, value } = this.props;
		const { showImageSelector } = this.state;

		if (showImageSelector) {
			let subfolder;
			if (sizeForSelector) {
				subfolder = `${sizeForSelector}/`;
			}
			return (
				<FileSelector
					isImage={true}
					onDestroy={() => this.setState({ showImageSelector: false })}
					onSelect={onChange}
					path={path}
					subfolder={subfolder}
					initialValue={value}
				/>
			);
		}
	}

	renderImageUploader() {
		const { showImageUploader } = this.state;
		const { path, onChange, acceptSVG, resize, dependentCheck } = this.props;

		if (showImageUploader) {
			const allowedFileTypes = ["jpg", "jpeg", "gif", "png"];
			if (acceptSVG) {
				allowedFileTypes.push("svg");
			}
			return (
				<FileUploader
					allowedFileTypes={allowedFileTypes}
					dependentCheck={dependentCheck}
					isImage={true}
					onComplete={onChange}
					onDestroy={() => this.setState({ showImageUploader: false })}
					resize={resize}
					path={path}
				/>
			);
		}
	}

	renderButtons() {
		const { onChange, readOnly, value } = this.props;
		if (!readOnly) {
			return (
				<div className="buttons">
					<button type="button" disabled={!value} onClick={() => onChange("")}>
						Clear
					</button>
					<button type="button" onClick={() => this.setState({ showImageUploader: true })}>
						Upload
					</button>
					<button type="button" onClick={() => this.setState({ showImageSelector: true })}>
						Choose
					</button>
				</div>
			);
		}
	}

	render() {
		const { bucketPaths, path, value } = this.props;

		let content;
		if (value.length) {
			content = (
				<Fragment>
					<img
						src={`${bucketPaths.root + path + value}?t=${new Date().getTime()}`}
						className="image-selector-field-image"
						title={value}
						alt="Selected Image"
					/>
					<strong>{value}</strong>
				</Fragment>
			);
		} else {
			content = <strong className="image-selector-field text">No Image Selected</strong>;
		}

		return (
			<div className="image-selector-field-wrapper">
				{content}
				{this.renderImageSelector()}
				{this.renderImageUploader()}
				{this.renderButtons()}
			</div>
		);
	}
}

export const ImageField = connector(_ImageField);
