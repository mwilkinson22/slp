//Modules
import _ from "lodash";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";
import { KeyOfType } from "~/types/KeyOfType";

//Interfaces
interface IProps<T> {
	display: KeyOfType<T, string> | ((o: T) => string | { content: ReactNode; textValue: string });
	items: Record<string | number, T>;
	itemAsPlural: string;
	searchable: boolean;
	sortBy?: keyof T | ((o: T) => string | number);
	url: (o: T) => string;
}

interface IState {
	searchTerm: string;
}

//Component
export class ItemList<T extends Record<string, any>> extends Component<IProps<T>, IState> {
	state = { searchTerm: "" };
	static defaultProps = {
		searchable: true,
		itemAsPlural: "Results"
	};

	renderSearchBar(): ReactNode | void {
		const { itemAsPlural, searchable } = this.props;
		const { searchTerm } = this.state;
		if (searchable) {
			return (
				<input
					onChange={ev => this.setState({ searchTerm: ev.target.value })}
					placeholder={`Filter ${itemAsPlural}`}
					value={searchTerm}
				/>
			);
		}
	}

	renderList(): ReactNode {
		const { display, itemAsPlural, items, sortBy, url } = this.props;
		const { searchTerm } = this.state;
		const listItemClassName = "card no-margin no-shadow";

		const listItems = _.chain(items)
			//Convert to object
			.map((item, key: keyof typeof items) => {
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

				return { key, url: url(item), content, sortValue, textValue, isFavourite };
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
					<li key={key}>
						<Link to={url} className={listItemClassName}>
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
			return <li className={listItemClassName}>No {itemAsPlural} Found</li>;
		}
	}

	render(): ReactNode {
		return (
			<div className="item-list">
				{this.renderSearchBar()}
				<ul>{this.renderList()}</ul>
			</div>
		);
	}
}
