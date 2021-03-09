export interface IRetrievedFile {
	uploaded: Date;
	size: number;
	name: string;
}

//Everything except the file property must be a string
export interface IUploadedFile {
	file: Blob;
	path: string;
	name: string;
	isImage: "true" | "false";

	//We call JSON.stringify() on a valid sharp.ResizeOptions object
	resize?: string;
}
