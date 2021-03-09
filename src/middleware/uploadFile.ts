import multer from "multer";

//Set up multer storage
const storage = multer.memoryStorage();

export const uploadFile = multer({ storage });
