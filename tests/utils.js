export function absPathFromRel(url, relPath) {
	return new URL(relPath, url).pathname
}

export function fn1() {}
export function fn2() {}
export function fn3() {}
export function fn4() {}
export function fn5() {}

export function toFileSuiteSchema({runnable, skip, todo, oneOrJustUsed, n_Tests}) {

	let fileSuite = {
		clusters: {
			runnable: runnable ? new Map(runnable) : new Map(),
			skip: skip ? new Map(skip) : new Map(),
			todo: todo ? new Map(todo) : new Map(),
		},
		oneOrJustUsed: oneOrJustUsed || false,
		n_Tests,
	}

	return fileSuite
}
