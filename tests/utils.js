export function absPathFromRel(url, relPath) {
	return new URL(relPath, url).pathname
}

export function fn1() {}
export function fn2() {}
export function fn3() {}
export function fn4() {}
export function fn5() {}

export function toSuiteSchema({runnable, skipped, todos, justUsed, testCount}) {

	let suite = {
		justUsed: justUsed === undefined ? false: true,
		clusters: {
			runnable: runnable ? new Map(runnable) : new Map(),
			skipped: skipped ? new Map(skipped) : new Map(),
			todos: todos ? new Map(todos) : new Map(),
		},
	}

	if (testCount !== undefined) suite.testCount = testCount

	return suite
}
