import schedule from "node-schedule";
import axios, { AxiosResponse } from "axios";
import { keys } from "~/config/keys";
import { Methods } from "~/controllers/enums/Methods";

//Helper Function
async function apiCall(method: Methods, path: string, extraData?: any) {
	let response: AxiosResponse | undefined;
	try {
		const url = `${keys.apiUrl}${path}?authGuid=${keys.authGuid}`;
		switch (method) {
			case Methods.get:
				response = await axios.get(url);
				break;
			case Methods.post:
				response = await axios.post(url, extraData);
				break;
			case Methods.put:
				response = await axios.put(url, extraData);
				break;
			case Methods.del:
				response = await axios.delete(url);
				break;
			default: {
				console.error("Invalid method supplied");
				break;
			}
		}
	} catch (e) {
		console.error("Error", e);
	}

	return response?.data;
}

//Delete old jobs
//Every day at midnight
schedule.scheduleJob("0 0 * * *", async function () {
	await apiCall(Methods.del, "games/old");
});

//Auto-post
//Every 15 minutes
schedule.scheduleJob("*/15 * * * *", async function () {
	await apiCall(Methods.post, "games/scheduledPosts");
});
