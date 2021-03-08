//Modules
import _ from "lodash";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";

//Interfaces
interface IProps<T> {
	display: keyof T | ((o: T) => ReactNode);
	items: Record<string | number, T>;
	itemAsPlural: string;
	searchable: boolean;
	sortBy: keyof T | ((o: T) => string | number);
	url: (o: T) => string;
}

interface IState {
	searchTerm: string;
}
//Component
export class ItemList<T> extends Component<IProps<T>, IState> {
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
					autoFocus={true}
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
			//Order
			.sortBy(item => {
				if (typeof sortBy === "function") {
					return sortBy(item);
				} else {
					return item[sortBy];
				}
			})
			//Convert to object
			.map((item, key: keyof typeof items) => {
				let content;
				if (typeof display === "function") {
					content = display(item);
				} else {
					content = item[display];
				}
				return { key, url: url(item), content };
			})
			//Filter on search term
			.filter(({ content }) => {
				if (!content) {
					//Something has gone wrong, and we shouldn't display this item
					return false;
				}

				return (content as string).toLowerCase().includes(searchTerm.toLowerCase());
			})
			//Convert to elements
			.map(({ key, url, content }) => {
				return (
					<li key={key}>
						<Link to={url} className={listItemClassName}>
							{content}
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
