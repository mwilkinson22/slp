//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect, ConnectedProps } from "react-redux";

//Components
import { OnPopupDialogDestroy, PopUpDialog } from "~/client/components/global/PopUpDialog";
import { LoadingPage } from "~/client/components/global/LoadingPage";

//Actions
import { fetchFiles } from "~/client/actions/fileActions";

//Interfaces
import { StoreState } from "~/client/reducers";
import { IRetrievedFile } from "~/models/File";
interface IProps extends ConnectedProps<typeof connector> {
	isImage: boolean;
	onDestroy: OnPopupDialogDestroy;
	onSelect: (filename: string) => void;
	path: string;
	subfolder?: string;
	initialValue: string;
}

interface IState {
	results?: IRetrievedFile[];
	searchTerm: string;
}

//Redux
function mapStateToProps({ config }: StoreState) {
	const { bucketPaths } = config;
	return { bucketPaths };
}
const connector = connect(mapStateToProps, { fetchFiles });

class _FileSelector extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		//Set initial state
		const { fetchFiles, path } = props;
		this.state = { searchTerm: "" };

		//Fetch files
		fetchFiles(`${path}`).then(results => this.setState({ results }));
	}

	renderSearchBar() {
		const { isImage } = this.props;
		const { searchTerm } = this.state;
		return (
			<input
				value={searchTerm}
				onChange={ev => this.setState({ searchTerm: ev.target.value })}
				placeholder={`Filter ${isImage ? "Images" : "Files"}`}
			/>
		);
	}

	renderResults() {
		const { bucketPaths, initialValue, isImage, onDestroy, onSelect, path, subfolder } = this.props;
		const { searchTerm } = this.state;
		const results = this.state.results as IRetrievedFile[];

		//Filter by search term
		const filteredResults = results.filter(({ name }) => name.toLowerCase().includes(searchTerm.toLowerCase()));

		//Create List
		let list;
		if (filteredResults.length) {
			list = _.sortBy(filteredResults, "name").map(file => {
				let imagePreview;
				if (isImage) {
					imagePreview = (
						<div className="image-preview">
							<img src={`${bucketPaths.root}${path}${subfolder || ""}${file.name}`} alt={file.name} />
						</div>
					);
				}
				const liClassNames = ["list-option"];
				if (initialValue === file.name) {
					liClassNames.push("initial-value");
				}
				return (
					<li
						key={file.name}
						className={liClassNames.join(" ")}
						onClick={() => {
							onSelect(file.name);
							onDestroy();
						}}
					>
						{imagePreview}
						<ul>
							<li>
								<strong>{file.name}</strong>
							</li>
							<li>
								<span>{(file.size / 1000).toFixed(1)}kb</span>
							</li>
							<li>
								<span>Uploaded {new Date(file.uploaded).toLocaleString()}</span>
							</li>
						</ul>
					</li>
				);
			});
		} else {
			list = <li className="no-results">No {isImage ? "Images" : "Files"} Found</li>;
		}

		//Get wrapper class
		const wrapperClassArray = ["file-selector-list"];
		if (isImage) {
			wrapperClassArray.push("image");
		}

		return (
			<div className={wrapperClassArray.join(" ")}>
				{this.renderSearchBar()}
				<div className="list-wrapper">
					<ul className="file-list">{list}</ul>
				</div>
				<div className="buttons">
					<button type="button" onClick={onDestroy}>
						Cancel
					</button>
				</div>
			</div>
		);
	}

	render() {
		const { onDestroy } = this.props;
		const { results } = this.state;

		let content;
		if (results === undefined) {
			content = <LoadingPage />;
		} else {
			content = this.renderResults();
		}

		return (
			<PopUpDialog onDestroy={onDestroy} fullSize={true}>
				{content}
			</PopUpDialog>
		);
	}
}

export const FileSelector = connector(_FileSelector);
