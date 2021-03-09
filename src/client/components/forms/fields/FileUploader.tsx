//Modules
import React, { Component, Fragment, RefObject } from "react";
import { connect, ConnectedProps } from "react-redux";
import { ResizeOptions } from "sharp";

//Components
import { PopUpDialog, OnPopupDialogDestroy } from "~/client/components/global/PopUpDialog";
import { LoadingPage } from "~/client/components/global/LoadingPage";

//Actions
import { fetchFiles, uploadFile } from "~/client/actions/fileActions";

//Helpers
import { getExtensionFromFileName } from "~/helpers/fileHelper";
import { listToString } from "~/helpers/genericHelper";

//Interfaces
import { StoreState } from "~/client/reducers";
interface IProps extends ConnectedProps<typeof connector> {
	allowedFileTypes?: string[];
	dependentCheck?: (filename: string) => { dataType: string; dependents: string[] };
	isImage: boolean;
	path: string;
	onComplete: (filename: string) => void;
	onDestroy: OnPopupDialogDestroy;
	resize?: Record<string, ResizeOptions>;
}
export interface FileUploaderProps extends IProps {}

interface IState {
	currentFile?: {
		originalName: string;
		name: string;
		ext: string;
		preview?: string;
	};
	conflictFound?: boolean;
	inputRef: RefObject<any>;
	isLoadingPreview: boolean;
	isSubmitting: boolean;
}

//Redux
function mapStateToProps({ config }: StoreState) {
	const { bucketPaths } = config;
	return { bucketPaths };
}
const connector = connect(mapStateToProps, { fetchFiles, uploadFile });

//Component
class _FileUploader extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		this.state = { inputRef: React.createRef(), isLoadingPreview: false, isSubmitting: false };
	}

	onFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
		const { isImage } = this.props;
		const input = ev.target;
		if (input.files && input.files[0]) {
			//Pull the uploaded file
			const file = input.files[0];

			//Create a "currentFile" object to be added to state
			const originalName = file.name;
			const ext = getExtensionFromFileName(file.name);
			const extensionRegex = new RegExp(`.${ext}`, "i");
			const currentFile: IState["currentFile"] = {
				originalName,
				ext,
				name: originalName.replace(extensionRegex, "")
			};

			//For images, we load a preview
			if (isImage) {
				this.setState({ isLoadingPreview: true });
				const reader = new FileReader();
				reader.readAsDataURL(input.files[0]);
				reader.onload = e => {
					if (e.target && e.target.result) {
						currentFile.preview = e.target.result.toString();
					}
					this.setState({ currentFile, isLoadingPreview: false });
				};
			} else {
				this.setState({ currentFile });
			}
		}
	}

	async onUploadAttempt() {
		const { fetchFiles, path } = this.props;
		const { currentFile } = this.state;

		if (!currentFile) {
			return;
		}

		this.setState({ isSubmitting: true });

		const allCurrentFiles = await fetchFiles(path);
		if (allCurrentFiles) {
			//Check to see if we have a conflict
			const conflictFound = allCurrentFiles.find(file => file.name === `${currentFile.name}.${currentFile.ext}`);
			if (conflictFound) {
				this.setState({ conflictFound: true, isSubmitting: false });
			} else {
				//Otherwise, skip this step and just upload
				return this.handleUpload();
			}
		}
	}

	async handleUpload() {
		const { path, isImage, onComplete, onDestroy, resize, uploadFile } = this.props;
		const { currentFile } = this.state;

		if (!currentFile || !currentFile.preview) {
			return;
		}

		this.setState({ isSubmitting: true });

		//First, create our current file into a blob
		const res = await fetch(currentFile.preview);
		const blob = await res.blob();

		//Create a form programmatically. With the exception of the file blob,
		//we can only attach string values here, but they will be parsed on the server
		const formData = new FormData();
		formData.append("file", blob);
		formData.append("path", path);
		formData.append("name", `${currentFile.name}.${currentFile.ext}`);
		formData.append("isImage", isImage.toString());

		if (isImage && resize) {
			formData.append("resize", JSON.stringify(resize));
		}

		//Submit the form and get the name back
		const result = await uploadFile(formData);
		if (result) {
			await onComplete(result.name);
			onDestroy();
		}
	}

	clearCurrentFile() {
		//Set the file input element's value to null
		const inputRef = { ...this.state.inputRef };
		inputRef.current.value = null;

		//Update state
		this.setState({ currentFile: undefined, inputRef });
	}

	validateFileName(): boolean {
		const { currentFile } = this.state;
		if (currentFile) {
			return !currentFile.name.match(/[^A-Za-z0-9_-]+/gi);
		}

		return false;
	}

	renderNameSelector() {
		const { currentFile } = this.state;
		if (currentFile) {
			let error;
			if (!this.validateFileName()) {
				error = (
					<span className="error">
						Filename can only consist of numbers, letters, hyphens and underscores
					</span>
				);
			}

			return (
				<Fragment>
					<div className="filename-selector">
						<label>File Name</label>
						<input
							type="text"
							placeholder="File Name Required"
							value={currentFile.name}
							onChange={ev =>
								this.setState({
									currentFile: {
										...currentFile,
										name: ev.target.value
									}
								})
							}
						/>
						<span>.{currentFile.ext}</span>
					</div>
					{error}
				</Fragment>
			);
		}
	}

	renderImagePreview() {
		const { isImage } = this.props;
		const { currentFile, isLoadingPreview } = this.state;

		if (isImage) {
			let content;
			if (isLoadingPreview) {
				content = <LoadingPage />;
			} else if (currentFile && currentFile.preview) {
				content = <img src={currentFile.preview} alt="Preview" />;
			}
			if (content) {
				return <div className="preview-wrapper">{content}</div>;
			}
		}
	}

	renderUploadButtons() {
		const { onDestroy } = this.props;
		const { currentFile, isSubmitting } = this.state;

		if (currentFile) {
			return (
				<div className="buttons">
					<button type="button" onClick={() => this.clearCurrentFile()}>
						Clear
					</button>
					<button
						type="button"
						className="confirm"
						disabled={!currentFile.name.length || !this.validateFileName() || isSubmitting}
						onClick={() => this.onUploadAttempt()}
					>
						{isSubmitting ? "Uploading" : "Upload"}
					</button>
				</div>
			);
		} else {
			return (
				<div className="buttons">
					<button type="button" onClick={onDestroy}>
						Cancel
					</button>
				</div>
			);
		}
	}

	renderConflictDialog() {
		const { bucketPaths, dependentCheck, path, isImage } = this.props;
		const { currentFile } = this.state;
		if (!currentFile) {
			return;
		}

		const filename = `${currentFile.name}.${currentFile.ext}`;

		//Get dependents
		let dependentDisclaimer;
		if (dependentCheck) {
			const { dataType, dependents } = dependentCheck(filename);
			if (dependents.length) {
				dependentDisclaimer = (
					<p className="error">
						<strong>Warning: </strong>
						Overwriting this file will update the image for the following {dataType}:{" "}
						{listToString(dependents)}
					</p>
				);
			}
		}

		//Get preview for images
		let imagePreview;
		if (isImage) {
			imagePreview = (
				<img
					src={`${bucketPaths.root}${path}${currentFile.name}.${currentFile.ext}?t=${Date.now()}`}
					alt="Image to overwrite"
				/>
			);
		}

		return (
			<Fragment>
				<div className="conflict-dialog">
					<h6>Overwrite existing {isImage ? "image" : "file"}?</h6>
					{imagePreview}
					<p>
						{currentFile.name}.{currentFile.ext} already exists, are you sure you wish to overwrite it?
					</p>
					{dependentDisclaimer}
				</div>
				<div className="buttons">
					<button type="button" onClick={() => this.setState({ conflictFound: false })}>
						Back
					</button>
					<button type="button" onClick={() => this.handleUpload()} className="confirm">
						Overwrite
					</button>
				</div>
			</Fragment>
		);
	}

	render() {
		const { allowedFileTypes, onDestroy } = this.props;
		const { conflictFound, inputRef } = this.state;

		//Limit filetypes
		let accept;
		if (allowedFileTypes) {
			accept = allowedFileTypes.map(ext => `.${ext.replace(/^\./, "")}`).join(",");
		}

		//Conditionally render conflict dialog
		let content;
		if (conflictFound) {
			content = this.renderConflictDialog();
		} else {
			content = (
				<div className="uploader-wrapper">
					<div>
						<label>Select File</label>
						<input
							accept={accept}
							key="input"
							type="file"
							ref={inputRef}
							onChange={ev => this.onFileChange(ev)}
						/>
					</div>
					{this.renderImagePreview()}
					{this.renderNameSelector()}
					{this.renderUploadButtons()}
				</div>
			);
		}

		return (
			<PopUpDialog className="file-uploader" onDestroy={onDestroy} fullSize={true}>
				{content}
			</PopUpDialog>
		);
	}
}

export const FileUploader = connector(_FileUploader);
