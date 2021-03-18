//Modules
import _ from "lodash";
import { Request, Response } from "express";

//Decorators
import { controller, use, get, post } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { requireAdmin } from "~/middleware/requireAdmin";

//Models
import { ISettings, Settings, defaultSettings } from "~/models/Settings";

//Get Settings method
export async function getSettings(groups?: (keyof ISettings)[]): Promise<Partial<ISettings>> {
	// If no "names" param is supplied we simply pull the keys from the defaultSettings object.
	// This ensures we'll get all required groups, since defaultSettings invokes ISettings
	if (!groups) {
		groups = Object.keys(defaultSettings) as (keyof ISettings)[];
	}

	//Pull settings from DB
	const settingsFromDb = await Settings.find({ group: { $in: groups as string[] } }).lean();

	//Combine into one object
	const settings = groups.map(key => {
		//First, pull the defaultSettings entry. We know this corresponds to the interface
		const values = defaultSettings[key as keyof ISettings];

		//Then find any corresponding database values and map them in
		settingsFromDb
			.filter(({ group }) => key === group)
			.forEach(({ name, value }) => {
				if (Object.prototype.hasOwnProperty.call(values, name)) {
					values[name] = value;
				}
			});

		//Otherwise return default value
		return [key, values];
	});

	return _.fromPairs(settings);
}

//Controller
@controller("/api/settings")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class SettingsController {
	//API Access to all settings
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
			for (const name in values[group]) {
				//Ensure we save an empty string instead of null
				const value = (values[group] as Record<string, string>)[name] || "";

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
