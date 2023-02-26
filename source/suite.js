import { SOPHI } from "./utils.js"

const SEP = " @$oph! "
const MOD = {
	ONE: 1,
	JUST: 2,
	SKIP: 3,
}

class Suite {
	constructor() {
		this.#initSuite()
		this.groupPath = []
	}

	#initSuite() {
		this.#resetSuite()
	}

	#resetSuite(oneOrJustUsed = false) {
		this.suite = {
			clusters: {
				runnable: new Map(),
				skip: new Map(),
				todo: new Map(),
				just: new Map(),
			},
			oneOrJustUsed,  // since just usage is across files, collect filters fileSuites based on this
		}
	}

	addGroup(groupName, fn, modifier = null) {

		if (modifier === MOD.ONE) {
			this.#resetSuite()
		}

		if (modifier === MOD.JUST) {
			const {clusters} = this.suite
			clusters.runnable = new Map()
			clusters.skip = new Map()
			clusters.todo = new Map()
		}

		this.groupPath.push({ groupName, modifier })

		fn()

		if (modifier === MOD.ONE) {
			this.suite.oneOrJustUsed = "one"
		}

		if (modifier === MOD.JUST) {
			this.suite.oneOrJustUsed = "just"
		}

		this.groupPath.pop()
	}

	addRegularTest(title, fn) {

		if (this.isModLowestParent(MOD.ONE)) {
			this.#addTest({ title, fn })
			return
		}

		if (this.isModLowestParent(MOD.JUST)) {
			this.addJustTest(title, fn)
			return
		}

		if (this.isModLowestParent(MOD.SKIP)) {
			this.addSkipTest(title)
			return
		}

		this.#addTest({ title, fn })
	}

	addOneTest(title, fn) {
		this.#resetSuite("one")
		this.#addTest({ title, fn })
	}

	addJustTest(title, fn) {
		if (this.suite.oneOrJustUsed === "one") {
			return
		}
		if (this.suite.oneOrJustUsed === false) {
			this.#resetSuite("just")
		}
		this.#addTest({ title, fn, clusterK: "just" })
	}

	addSkipTest(title) {
		if (this.suite.oneOrJustUsed) {
			return
		}
		this.#addTest({ title, clusterK: "skip" })
	}

	addTodoTest(title) {
		if (this.suite.oneOrJustUsed || this.isModLowestParent(MOD.ONE) || this.isModLowestParent(MOD.JUST) || this.isModLowestParent(MOD.SKIP)) {
			return
		}
		this.#addTest({ title, clusterK: "todo" })
	}

	addObjAPITest(opts) {
		this.#addTest(opts)
	}

	#addTest({ title, fn, groupPath = this.groupPath, clusterK = "runnable" } = {}) {

		const test_id = this.#testID(title, groupPath)

		const obj = clusterK === "todo" || clusterK === "skip" ? ({}) : ({fn: fn})

		this.suite.clusters[clusterK].set(test_id, obj)
	}

	#testID(testTitle, groupPath) {
		let { suite: { clusters: { runnable, skip, todo, just } } } = this

		const testID = buildTestID(groupPath.map(s => s.groupName), testTitle)

		if (runnable.has(testID) || skip.has(testID) || todo.has(testID) || just.has(testID)) {
			throwDuplicateName(testID, globalThis[SOPHI].testFilePath)
		}

		return testID
	}

	pullSuite() {
		const suite = this.suite

		this.#initSuite()
		let n_Tests = 0
		const {clusters} = suite
		for (const clusterK in clusters) {
			n_Tests += clusters[clusterK].size
		}
		suite.n_Tests = n_Tests

		if (clusters.just.size > 0) {
			clusters.runnable = clusters.just
		}

		delete clusters.just

		return suite
	}

	isModLowestParent(mod) {
		const {groupPath} = this
		for (let i = groupPath.length - 1; i >= 0; i--) {
			if (groupPath[i].modifier === mod) return true
		}
		return false
	}
}


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
	return { testTitle, groups }
}

export function throwDuplicateName(testID, filePath) {
	const name = testID.split(SEP).map(t => `"${t}"`).join(" ▶ ")
	throw new Error(`Duplicate test name ${name} in same file: ${filePath}`)
}


const collector = new Suite()
const globSophi = { collector }

// since ESM modules are cached so this should eval once
globalThis[SOPHI] = globSophi


export function group(groupName, fn) {
	collector.addGroup(groupName, fn)
}

function groupOne(groupName, fn) {
	collector.addGroup(groupName, fn, MOD.ONE)
}

function groupJust(groupName, fn) {
	collector.addGroup(groupName, fn, MOD.JUST)
}

function groupSkip(groupName, fn) {
	collector.addGroup(groupName, fn, MOD.SKIP)
}

group.one = groupOne
group.$$ = groupOne
group.just = groupJust
group.$ = groupJust
group.skip = groupSkip


export function test(title, fn) {
	collector.addRegularTest(title, fn)
}

function testOne(title, fn) {
	collector.addOneTest(title, fn)
}

function testJust(title, fn) {
	collector.addJustTest(title, fn)
}

function testSkip(title, fn) {
	collector.addSkipTest(title, fn)
}

function testTodo(title) {
	collector.addTodoTest(title)
}

test.one = testOne
test.$$ = testOne
test.just = testJust
test.$ = testJust
test.skip = testSkip
test.todo = testTodo


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
				suite.addObjAPITest({title: k, fn: v, groupPath: path})
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
