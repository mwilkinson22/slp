export function getExtensionFromFileName(path: string): string {
	return (path.split(".").pop() as string).toLowerCase();
}
