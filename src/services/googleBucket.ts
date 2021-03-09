import { Storage } from "@google-cloud/storage";

import { keys } from "~/config/keys";
const { googleCloudAccount, googleBucketName } = keys;

export const bucket = new Storage({
	credentials: googleCloudAccount
}).bucket(googleBucketName);
