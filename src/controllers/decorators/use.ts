import "reflect-metadata";
import { RequestHandler } from "express";
import { MetadataKeys } from "../enums/MetadataKeys";

export function use(middleware: RequestHandler) {
	return function(target: any, key: string) {
		const middlewares = Reflect.getMetadata(MetadataKeys.middleware, target, key) || [];

		middlewares.push(middleware);

		Reflect.defineMetadata(MetadataKeys.middleware, middlewares, target, key);
	};
}
