//Modules
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { ISettings, Settings, defaultSettings } from "~/models/Settings";

//Get Settings method
export async function getSettings(): Promise<ISettings>;
export async function getSettings(group: keyof ISettings): Promise<ISettings[keyof ISettings]>;
export async function getSettings(group?: keyof ISettings) {
	//Conditionally limit what we pull from the DB
	const query: Record<string, keyof ISettings> = {};
	if (group) {
		query.group = group;
	}
	const settingsFromDb = await Settings.find(query).lean();

	//A callback function that takes a group name, and returns all its settings
	const mergeDbAndDefaultValues = (key: keyof ISettings): ISettings[keyof ISettings] => {
		//First, pull the defaultSettings entry. We know this corresponds to the interface
		const values: ISettings[typeof key] = { ...defaultSettings[key] };

		//Then find any corresponding database values and map them in
		for (const name in values) {
			const valueFromDb = settingsFromDb.find(s => s.group === key && s.name === name);

			if (valueFromDb) {
				Object.assign(values, { [name]: valueFromDb.value });
			}
		}

		//Otherwise return default value
		return values;
	};

	if (group) {
		//If we want one specific group, then we just call the callback and return it
		return mergeDbAndDefaultValues(group);
	} else {
		//Otherwise, loop all the groups and return the result
		const values: ISettings = { ...defaultSettings };
		for (const group in values) {
			const results = mergeDbAndDefaultValues(group as keyof ISettings);
			Object.assign(values, { [group]: results });
		}
		return values;
	}
}

//Controller
@controller("/api/settings")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SettingsController {
	@get("/")
	@use(requireAuth)
	async getAllSettings(req: Request, res: Response) {
		const settings = await getSettings();
		res.send(settings);
	}

	//Update individual settings
	@post("/")
	@use(requireAdmin)
	async updateSettings(req: Request, res: Response) {
		const values: Partial<ISettings> = req.body;

		//Create bulkOperations array
		const bulkOperations = [];
		//First, loop through the groups
		for (const group in values) {
			//Then through the name/value pairs
			for (const name in values[group as keyof ISettings]) {
				//Ensure we save an empty string instead of null
				const value = (values[group as keyof ISettings] as Record<string, string>)[name] || "";

				bulkOperations.push({
					updateOne: {
						filter: { name, group },
						update: { name, group, value },
						upsert: true
					}
				});
			}
		}

		//Write Values
		if (bulkOperations.length) {
			await Settings.bulkWrite(bulkOperations);
		}

		//Return empty object
		res.send({});
	}
}
