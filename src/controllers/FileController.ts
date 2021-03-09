//Modules
import sharp, { ResizeOptions } from "sharp";

//Types & Interfaces
import { Express, Request, Response } from "express";
import { File as GoogleFile, GetFilesResponse } from "@google-cloud/storage";
import { IUploadedFile, IRetrievedFile } from "~/models/File";
type GoogleUploadResult = IRetrievedFile | string;
type MulterFile = Express.Multer.File;

//Decorators
import { controller, use, get, post } from "./decorators";

//Middleware
import { requireAuth } from "~/middleware/requireAuth";
import { uploadFile } from "~/middleware/uploadFile";

//Service
import { bucket } from "~/services/googleBucket";

//Helpers
import { getExtensionFromFileName } from "~/helpers/fileHelper";

//Controller
@controller("/api/files")
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class FileController {
	//Helper methods
	static validatePath(path: string, res: Response) {
		let error;
		//Ensure a valid directory format
		if (path.substr(0, 1) === "/") {
			error = "Paths cannot begin with a slash";
		} else if (!path.match(/\/$/)) {
			error = "Paths must end with a slash";
		}

		if (error) {
			res.status(400).send(`Invalid path: "${path}". ${error}`);
			return false;
		}

		return true;
	}

	//If successful, we return a retrieved file.
	//Otherwise we return an error message
	static async uploadFileToGoogle(file: MulterFile, path: string): Promise<GoogleUploadResult> {
		const { originalname, buffer, mimetype } = file;

		const bucketFile = bucket.file(path + originalname);
		return new Promise(resolve => {
			const stream = bucketFile.createWriteStream({
				metadata: {
					contentType: mimetype,
					cacheControl: "public, max-age=31536000"
				}
			});
			stream.on("error", err => {
				resolve(err.toString());
			});
			stream.on("finish", () => {
				resolve({ name: originalname, uploaded: new Date(), size: file.size });
			});
			stream.end(buffer);
		});
	}

	static async uploadImageToGoogle(
		originalFile: MulterFile,
		path: string,
		resize?: ResizeOptions
	): Promise<GoogleUploadResult> {
		//Using sharp().clone() doesn't seem to work as expected, so we
		//deconstruct the file object to prevent permanent changes.
		//Among other things, this prevents issues when resizing multiple times
		const file = { ...originalFile };

		//Process file name & extension
		const extension = getExtensionFromFileName(file.originalname);

		//Create a sharp object
		let image = sharp(file.buffer);

		//Resize if necessary
		if (resize) {
			const resizeOptions = {
				withoutEnlargement: true,
				...resize
			};
			image = image.resize(resizeOptions);
		}

		//Update based on file type
		switch (extension) {
			case "jpg":
			case "jpeg":
				file.mimetype = "image/jpeg";
				image = image.jpeg();
				break;
			case "png":
				file.mimetype = "image/png";
				image = image.png();
				break;
			case "svg":
				file.mimetype = "image/svg+xml";
				break;
		}

		//Convert to buffer
		file.buffer = await image.toBuffer();

		//Upload to google and return result
		return FileController.uploadFileToGoogle(file, path);
	}

	//Get all files within a directory
	@get("/:path")
	@use(requireAuth)
	async getFiles(req: Request, res: Response) {
		const { path } = req.params;

		//Check for subfolders
		//Default to false
		const showSubfolders = req.query.subfolders || false;

		//Get directory to search
		const directory = decodeURIComponent(path);

		//Ensure a valid directory format
		if (!FileController.validatePath(directory, res)) {
			return;
		}

		//Get files
		const request: GetFilesResponse = await bucket.getFiles({
			autoPaginate: false,
			directory
		});

		const files = request[0]
			//Map to the object format we need
			.map(
				(f: GoogleFile): IRetrievedFile => {
					const { timeCreated: created, size } = f.metadata;
					return {
						uploaded: created,
						size,
						name: f.name.replace(path, "")
					};
				}
			)
			//Remove root folder option
			.filter(f => f.name && f.name.length)
			//Remove anything with a forward slash (i.e. from subdirectories)
			.filter(f => showSubfolders || !f.name.includes("/"));

		res.send(files);
	}

	//Upload file to Google Cloud
	@post("/")
	@use(requireAuth)
	@use(uploadFile.single("file"))
	async handleFileUpload(req: Request, res: Response) {
		const uploadedFile: IUploadedFile = req.body;
		const { path, name } = uploadedFile;

		//This is fired from a FormData object, so we convert our string boolean
		const isImage = uploadedFile.isImage === "true";

		//Add "name" from form to file blob
		req.file.originalname = name;

		//Ensure a valid directory format
		if (!FileController.validatePath(path, res)) {
			return;
		}

		//Create a result object
		let result;
		if (!isImage) {
			//No need for further changes, just upload directly
			result = await FileController.uploadFileToGoogle(req.file, path);
		} else {
			//Just like the isImage bool, we parse the resize object from a string
			//Initially we set this to empty;
			let resize: Record<string, ResizeOptions> = {};

			//Get the file extension
			const extension = getExtensionFromFileName(name);

			//We only resize jpg and png files, so only update the
			//resize object when necessary
			if (uploadedFile.resize && ["jpg", "jpeg", "png"].includes(extension)) {
				resize = JSON.parse(uploadedFile.resize);
			}

			//We can add a "defaultSize" key to the resize object. This will resize
			//the file at the path root, every other key will be a subfolder.
			//We destructure the object here. If no defaultSize has been defined,
			//it will not be resized
			const { defaultSize, ...alternateSizes } = resize;

			//Create an array of files to upload, and recover the first one as our result variable
			const promises = [FileController.uploadImageToGoogle(req.file, path, defaultSize)];

			for (const size in alternateSizes) {
				promises.push(FileController.uploadImageToGoogle(req.file, `${path}${size}/`, alternateSizes[size]));
			}

			const [defaultSizeResult] = await Promise.all(promises);
			result = defaultSizeResult;
		}

		if (typeof result === "string") {
			//Error
			res.status(500).send(result);
		} else {
			//Success
			res.send(result);
		}
	}
}
