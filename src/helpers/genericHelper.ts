//Take a nested object and convert it to dot notation,
//e.g. - Pass In { name: { first: "John", last: "Smith" }, age: 25 }
// Get back { "name.first": "John", "name.last": "Smith" }

//We also have an ObjectToDot typescript type
//First, PathsToProps runs recursively and gets all the paths to any fields of
//type V
type PathsToProps<T, V = string | boolean | number | any[]> = T extends V
	? []
	: { [K in Extract<keyof T, V>]: [K, ...PathsToProps<T[K]>] }[Extract<keyof T, V>];

//Then we pass in this array of paths to Join and return a single-depth object with the
//correct types
type JoinPaths<T extends string[], D extends string> = T extends []
	? never
	: T extends [infer F]
	? F
	: T extends [infer F, ...infer R]
	? F extends string
		? `${F}${D}${JoinPaths<Extract<R, string[]>, D>}`
		: never
	: string;
export type ObjectToDot<T extends Record<string, any>> = JoinPaths<PathsToProps<T>, ".">;

export function nestedObjectToDot<T = any>(object: T, pullObjectsContaining: string | null = null): ObjectToDot<T> {
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
	const fixSingleWord = (str: string): string => str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();

	if (everyWord) {
		return string.split(" ").map(fixSingleWord).join(" ");
	} else {
		return fixSingleWord(string);
	}
}

export function validateHashtag(string: string): boolean {
	return !string.match(/[^0-9A-Za-z_]/);
}

function dateToISO(date: Date): string {
	//Adjust for timezones
	const offset = date.getTimezoneOffset();
	date = new Date(date.getTime() - offset * 60 * 1000);

	//Return ISO string and split before the "T" character,
	//giving us yyyy-MM-dd
	return date.toISOString();
}

export function dateToYMD(date: Date): string {
	//Return ISO string and split before the "T" character,
	//giving us yyyy-MM-dd
	return dateToISO(date).split("T")[0];
}

export function dateToHMS(date: Date): string {
	//Return ISO string and split on the "T" character,
	//giving us the time, then grab the first 8 chars
	return dateToISO(date).split("T")[1].substr(0, 8);
}
