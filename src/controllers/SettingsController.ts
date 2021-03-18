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
export async function getSettings(names?: (keyof ISettings)[]): Promise<Partial<ISettings>> {
	// If no "names" param is supplied we simply pull the keys from the defaultSettings object.
	// This ensures we'll get all required keys, since defaultSettings invokes ISettings
	if (!names) {
		names = Object.keys(defaultSettings) as (keyof ISettings)[];
	}

	//Pull settings from DB
	const settingsFromDb = await Settings.find({ name: { $in: names } }).lean();

	//Combine into one object
	const settings = names.map(key => {
		//Try and use DB entry first
		const dbEntry = settingsFromDb.find(({ name }) => key === name);
		if (dbEntry) {
			return [key, dbEntry.value];
		}

		//Otherwise return default value
		return [key, defaultSettings[key as keyof ISettings]];
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
		for (const name in values) {
			//Ensure we save an empty string instead of null
			const value = values[name as keyof ISettings] || "";
			bulkOperations.push({
				updateOne: {
					filter: { name },
					update: { name, value },
					upsert: true
				}
			});
		}

		//Write Values
		if (bulkOperations.length) {
			await Settings.bulkWrite(bulkOperations);
		}

		//Return empty object
		res.send({});
	}
}
