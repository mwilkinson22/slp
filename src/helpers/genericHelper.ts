export function nestedObjectToDot(object: any, pullObjectsContaining: string | null = null) {
	const result: any = {};
	(function recurse(obj: any, current: string | null) {
		for (const key in obj) {
			const value = obj[key];
			const newKey = current ? current + "." + key : key;
			//pullObjectsContaining allows us to stop recursion once
			//we find an object containing a specific value. Useful
			//when we want to pull a react-select object for value injections
			if (
				value &&
				typeof value === "object" &&
				(!pullObjectsContaining || value[pullObjectsContaining] === undefined)
			) {
				recurse(value, newKey);
			} else {
				result[newKey] = value;
			}
		}
	})(object, null);

	return result;
}

export function listToString(list: string[] | number[]) {
	if (list.length === 1) {
		return list[0];
	} else {
		const lastItem = list.pop();
		return `${list.join(", ")} & ${lastItem}`;
	}
}

export function stringToProper(string: string, everyWord: boolean = false): string {
	const fixSingleWord = (str: string): string =>
		str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();

	if (everyWord) {
		return string
			.split(" ")
			.map(fixSingleWord)
			.join(" ");
	} else {
		return fixSingleWord(string);
	}
}
