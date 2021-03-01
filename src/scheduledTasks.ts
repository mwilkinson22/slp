import schedule from "node-schedule";
import axios, { AxiosResponse } from "axios";
import { keys } from "~/config/keys";

//Helper Function
async function apiCall(path: string) {
	let response: AxiosResponse | undefined;
	try {
		response = await axios.get(`${keys.apiUrl}${path}?authGuid=${keys.authGuid}`);
	} catch (e) {
		console.error("Error", e);
	}

	return response?.data;
}

//Example Job
// schedule.scheduleJob("0 7 1 * *", async function() {
// 	await apiCall("payees/upcoming/thisMonth");
// });
