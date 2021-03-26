//Modules
import _ from "lodash";
import React, { Component, ComponentType, ReactNode } from "react";
import { connect, ConnectedProps } from "react-redux";
import { Link } from "react-router-dom";
import { KeyOfType } from "~/types/KeyOfType";
import { StoreState } from "~/client/reducers";

//Components
import { ErrorBoundary } from "~/client/components/hoc/ErrorBoundary";

//Interfaces
interface IPassedProps<T> {
	display: KeyOfType<T, string> | ((o: T) => string | { content: ReactNode; textValue: string });
	items: Record<string | number, T> | T[];
	itemAsPlural?: string;
	listItemClassName?: string;
	searchable?: boolean;
	sortBy?: keyof T | ((o: T) => string | number);
	url: (o: T) => string;
}
interface IProps<T> extends IPassedProps<T>, ConnectedProps<typeof connector> {}

interface IState {
	searchTerm: string;
}

//Redux
function mapStateToProps({ config }: StoreState) {
	const { deviceType } = config;
	return { deviceType };
}

const connector = connect(mapStateToProps);

//Component
class _ItemList<T extends Record<string, any>> extends Component<IProps<T>, IState> {
	static defaultProps = {
		listItemClassName: "basic-list-item"
	};
	state = { searchTerm: "" };

	renderSearchBar(): ReactNode | void {
		const { deviceType, itemAsPlural, searchable } = this.props;
		const { searchTerm } = this.state;
		if (searchable) {
			return (
				<input
					autoFocus={deviceType === "desktop"}
					onChange={ev => this.setState({ searchTerm: ev.target.value })}
					placeholder={`Filter ${itemAsPlural}`}
					value={searchTerm}
				/>
			);
		}
	}

	renderList(): ReactNode {
		const { display, itemAsPlural, items, listItemClassName, sortBy, url } = this.props;
		const { searchTerm } = this.state;
		const linkItemClassName = "card no-margin no-shadow";

		let itemsAsArray: T[];
		if (Array.isArray(items)) {
			itemsAsArray = items;
		} else {
			itemsAsArray = Object.values(items);
		}

		const listItems = _.chain(itemsAsArray)
			//Convert to object
			.map((item: T) => {
				let content, textValue;
				if (typeof display === "function") {
					const result = display(item);
					if (typeof result === "string") {
						content = textValue = result;
					} else {
						content = result.content;
						textValue = result.textValue;
					}
				} else {
					content = item[display];
					textValue = content;
				}

				//Wrap plain text in spam
				if (typeof content === "string") {
					content = <span>{content}</span>;
				}

				let sortValue;
				if (typeof sortBy === "function") {
					sortValue = sortBy(item);
				} else if (sortBy) {
					sortValue = item[sortBy];
				} else {
					sortValue = textValue;
				}

				//Check for favourite
				const isFavourite = item.isFavourite ?? false;

				return { key: item._id, url: url(item), content, sortValue, textValue, isFavourite };
			})
			//Order
			.orderBy(["isFavourite", "sortValue"], ["desc", "asc"])
			//Filter on search term
			.filter(({ textValue }) => {
				if (!textValue) {
					//Something has gone wrong, and we shouldn't display this item
					return false;
				}

				return (textValue as string).toLowerCase().includes(searchTerm.toLowerCase());
			})
			//Convert to elements
			.map(({ key, url, content, isFavourite }) => {
				let favouriteStar;
				if (isFavourite) {
					favouriteStar = <span className="fav-star">{"\u2b50"}</span>;
				}
				return (
					<li key={key} className={listItemClassName}>
						<Link to={url} className={linkItemClassName}>
							{content}
							{favouriteStar}
						</Link>
					</li>
				);
			})
			.value();
		if (listItems.length) {
			return listItems;
		} else {
			return <li className={linkItemClassName}>No {itemAsPlural} Found</li>;
		}
	}

	render(): ReactNode {
		return (
			<ErrorBoundary>
				<div className="item-list">
					{this.renderSearchBar()}
					<ul>{this.renderList()}</ul>
				</div>
			</ErrorBoundary>
		);
	}
}

export function ItemList<T>(passedProps: IPassedProps<T>) {
	const defaultProps = {
		searchable: true,
		itemAsPlural: "Results"
	};
	const props = {
		...defaultProps,
		...passedProps
	};
	return React.createElement(connector(_ItemList as ComponentType<IProps<T>>), props);
}
