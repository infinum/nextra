let instance: Worker | null = null;

export function getSearchWorkerInstance(): Worker {
	if (instance === null) {
		instance = new Worker('/docs/search.worker.js');
	}

	return instance;
}