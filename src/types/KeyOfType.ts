//Similar to keyof, but enforces a strict return type
//We use Pick<> to create a type similar to T but with just the keys that return ReturnedType.
//We then use keyof that
export type KeyOfType<T, ReturnedType> = keyof Pick<
	T,
	{ [K in keyof T]: T[K] extends ReturnedType ? K : never }[keyof T]
>;
