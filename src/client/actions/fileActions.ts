//Interfaces
import { Dispatch } from "redux";
import { AxiosInstance } from "axios";
import { IRetrievedFile } from "~/models/File";

export const fetchFiles = (path: string) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.get<IRetrievedFile[]>(`/files/${encodeURIComponent(path)}`);
		if (res.data) {
			return res.data;
		}
	};
};

export const uploadFile = (data: FormData) => {
	return async (dispatch: Dispatch, getState: any, api: AxiosInstance) => {
		const res = await api.post<IRetrievedFile>("/files", data);
		if (res.data) {
			return res.data;
		}
	};
};
