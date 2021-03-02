//Modules
import _ from "lodash";
import React, { Component, ReactNode } from "react";
import { Link } from "react-router-dom";

//Interfaces
import { KeyedCollection } from "~/types";
interface IProps<T> {
	display: keyof T | ((o: T) => ReactNode);
	items: KeyedCollection<T>;
	sortBy: keyof T | ((o: T) => string | number);
	url: (o: T) => string;
}

//Component
export class ItemList<T> extends Component<IProps<T>> {
	render() {
		const { display, items, sortBy, url } = this.props;
		const listItems = _.chain(items)
			.sortBy(item => {
				if (typeof sortBy === "function") {
					return sortBy(item);
				} else {
					return item[sortBy];
				}
			})
			.map((item, key: keyof typeof items) => {
				let content;
				if (typeof display === "function") {
					content = display(item);
				} else {
					content = item[display];
				}
				return (
					<li key={key}>
						<Link to={url(item)} className="card no-margin no-shadow">
							{content}
						</Link>
					</li>
				);
			})
			.value();

		return <ul className="item-list">{listItems}</ul>;
	}
}
