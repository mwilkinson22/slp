const googleBucket = "https://storage.googleapis.com/superleaguepod/";
const imagePath = googleBucket + "images/";

let localUrl: string;
if (typeof window !== "undefined") {
	localUrl = window.location.protocol + "//" + window.location.host;
} else {
	localUrl = "";
}
export { googleBucket, imagePath, localUrl };
