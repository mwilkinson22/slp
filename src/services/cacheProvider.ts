import NodeCache from "node-cache";
let cache: NodeCache;

export function startCache() {
	if (!cache) {
		cache = new NodeCache();
	}
}

export function getCacheInstance() {
	if (!cache) {
		startCache();
	}
	return cache;
}
