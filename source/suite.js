import { relPathFromProjectRoot, SOPHI } from "./utils.js"

const SEP = " @$oph! "
const C = {
	JUST: 0,
	ONLY: 1,
	SKIP: 2,
	TODO: 3,
}

export class Suite {
	constructor(testFilePath) {

		if (testFilePath !== undefined) {
			this.testFilePath = new URL(testFilePath).pathname
		}

		this.initSuite()
	}

	initSuite() {
		this.suite = {
			clusters: {
				runnable: new Map(), // id -> {fn: testFn}
				skipped: new Map(), // id -> empty object for future metadata (like file location)
				todos: new Map(),   // idem
			},
			justUsed: false,   // since just usage is across files, suite of all fileSuites checks this flag
			testCount: 0,
		}
		this.group_path = []
		this.onlyOrJustUsed = false
	}

	markOnlyUsed() {
		this.onlyOrJustUsed = true
	}

	markJustUsed() {
		this.onlyOrJustUsed = true
		this.suite.justUsed = true
	}

	addTest(testTitle, testFn, modifier = null, path = null) {

		let { group_path, suite: { clusters: { runnable, skipped, todos } } } = this

		group_path = path || group_path

		const testID = buildTestID(group_path.map(s => s.groupName), testTitle)

		if (runnable.has(testID) || skipped.has(testID) || todos.has(testID)) {
			throwDuplicateName(testID, globalThis[SOPHI].testFilePath)
		}

		this.suite.testCount++

		if (modifier === C.TODO) {
			todos.set(testID, {})
			return
		}

		if (modifier === C.SKIP || inPath(C.SKIP)) {
			skipped.set(testID, {})
			return
		}

		// last test.just wins
		if (modifier === C.JUST) {
			this.moveAllRunnableToSkipped()
			this.markJustUsed()
			runnable.set(testID, { fn: testFn })
			return
		}

		// last test.only wins
		if (modifier === C.ONLY) {
			this.moveAllRunnableToSkipped()
			this.markOnlyUsed()
			runnable.set(testID, { fn: testFn })
			return
		}

		if (this.onlyOrJustUsed) {
			skipped.set(testID, {})
			return
		}

		runnable.set(testID, { fn: testFn })


		function inPath(_modifier) {
			for (const { modifier } of group_path) {
				if (modifier === _modifier) return true
			}
			return false
		}

	}

	moveAllRunnableToSkipped() {
		let { suite: { clusters: { runnable, skipped } } } = this

		for (const [test_id, test] of runnable) {
			runnable.delete(test_id)
			delete test.fn
			skipped.set(test_id, test)
		}
	}

	addGroup(groupName, fn, modifier = null) {

		if (modifier === C.JUST) {
			this.moveAllRunnableToSkipped()
		}

		if (modifier === C.ONLY) {
			this.moveAllRunnableToSkipped()
		}

		this.group_path.push({ groupName, modifier })

		fn()

		if (modifier === C.JUST) {
			this.markJustUsed()
		}
		if (modifier === C.ONLY) {
			this.markOnlyUsed()
		}

		this.group_path.pop()
	}

	pullSuite() {
		const suite = this.suite
		this.initSuite()
		return suite
	}

	group(groupName, fn) {
		this.addGroup(groupName, fn)
	}

	test(title, fn) {
		this.addTest(title, fn)
	}
}

// Suite.prototype.group = group
// Suite.prototype.test = test

export function buildTestID(path, title) {

	if (path.length === 0) return title

	let id = path.join(SEP)
	id += SEP + title

	return id
}

export function extractTestTitleAndGroups(testID) {
	let arr = testID.split(SEP)
	const testTitle = arr[arr.length - 1]
	arr.pop()
	const groups = arr
	return {testTitle, groups}
}

export function throwDuplicateName(testID, file_path) {
	file_path = relPathFromProjectRoot(file_path)
	const name = testID.split(SEP).map(t => `"${t}"`).join(" ▶ ")
	throw new Error(`Duplicate test name ${name} in same file: ${file_path}`)
}


const collector = new Suite()
const globSophi = {collector}

// since ESM modules are cached, this should be set it up once
globalThis[SOPHI] = globSophi


export function group(groupName, fn) {
	collector.addGroup(groupName, fn)
}

group.just = (groupName, fn) => {
	collector.addGroup(groupName, fn, C.JUST)
}

export const $$group = group.just

group.only = (groupName, fn) => {
	collector.addGroup(groupName, fn, C.ONLY)
}

group.skip = (groupName, fn) => {
	collector.addGroup(groupName, fn, C.SKIP)
}


export function test(title, fn) {
	collector.addTest(title, fn)
}

test.just = (title, fn) => {
	collector.addTest(title, fn, C.JUST)
}

export const $test = test.just

test.only = (title, fn) => {
	collector.addTest(title, fn, C.ONLY)
}

test.skip = (title, fn) => {
	collector.addTest(title, fn, C.SKIP)
}

test.todo = (title) => {
	collector.addTest(title, null, C.TODO)
}

export {
	group as describe,
	group as subject,
	group as theFunction,
	group as theClass,
	group as theMethod,
	test as it,
}


export function objToSuite(objSuite) {

	const suite = new Suite()

	_objToSuite(objSuite, [])

	return suite.pullSuite()


	function _objToSuite(obj, path) {

		for (const k in obj) {

			const v = obj[k]

			if (typeof v === "function") {
				suite.addTest(k, v, null, path)
				continue
			}
			else {
				path.push({ groupName: k, modifier: null })
				_objToSuite(v, path)
				path.pop()
			}
		}
	}
}
