import { SOPHI, SEP } from "./utils.js"

const MOD = {
	ONE: 1,
	JUST: 2,
	SKIP: 3,
}
const C = {
	RUNNABLE: 1,
	SKIP: 2,
	TODO: 3,
	JUST: 4,
}

class Suite {
	constructor() {
		this.#initSuite()
		this.groupPath = []
		this.testFilePath = undefined  // set by ./run.js
	}

	#initSuite() {
		this.#resetSuite()
	}

	#resetSuite(oneOrJustUsed = false) {
		this.suite = {
			clusters: {
				runnable: new Map(),
				skip: new Set(),
				todo: new Set(),
				just: new Map(),
			},
			oneOrJustUsed: oneOrJustUsed,  // since just usage is across files, collect filters fileSuites based on this
		}
	}

	addGroup(groupName, fn, modifier = null) {

		if (modifier === MOD.ONE) {
			this.#resetSuite()
		}

		if (modifier === MOD.JUST) {
			const {clusters} = this.suite
			clusters.runnable = new Map()
			clusters.skip = new Set()
			clusters.todo = new Set()
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
		if (this.suite.oneOrJustUsed === "one") {
			return
		}

		if (this.isModLowestParent(MOD.ONE)) {
			this.#addTest(title, C.RUNNABLE, fn)
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

		this.#addTest(title, C.RUNNABLE, fn)
	}

	addOneTest(title, fn) {
		this.#resetSuite("one")
		this.#addTest(title, C.RUNNABLE, fn)
	}

	addJustTest(title, fn) {
		if (this.suite.oneOrJustUsed === "one") {
			return
		}
		if (this.suite.oneOrJustUsed === false) {
			this.#resetSuite("just")
		}
		this.#addTest(title, C.JUST, fn)
	}

	addSkipTest(title) {
		if (this.suite.oneOrJustUsed) {
			return
		}
		this.#addTest(title, C.SKIP)
	}

	addTodoTest(title) {
		if (this.suite.oneOrJustUsed || this.isModLowestParent(MOD.ONE) || this.isModLowestParent(MOD.JUST) || this.isModLowestParent(MOD.SKIP)) {
			return
		}
		this.#addTest(title, C.TODO)
	}

	addObjAPITest({ title, fn, groupPath }) {
		this.#addTest(title, C.RUNNABLE, fn, groupPath)
	}

	#addTest(title, cluster, fn, groupPath = this.groupPath) {

		const test_id = this.#testID(title, groupPath)

		const { clusters } = this.suite

		if (cluster === C.RUNNABLE) {
			clusters.runnable.set(test_id, fn)
		}
		else if (cluster === C.SKIP) {
			clusters.skip.add(test_id)
		}
		else if (cluster === C.TODO) {
			clusters.todo.add(test_id)
		}
		else {  // C.JUST
			clusters.just.set(test_id, fn)
		}
	}

	#testID(testTitle, groupPath) {
		let { suite: { clusters: { runnable, skip, todo, just } } } = this

		const testID = buildTestID(groupPath.map(s => s.groupName), testTitle)

		if (runnable.has(testID) || skip.has(testID) || todo.has(testID) || just.has(testID)) {
			throwDuplicateName(testID, this.testFilePath)
		}

		return testID
	}

	pullSuite() {
		const suite = this.suite

		this.#initSuite()

		const { clusters } = suite

		let n_Tests = 0
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
		const { groupPath } = this
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

export function throwDuplicateName(testID, filePath) {
	const name = testID.split(SEP).map(x => `"${x}"`).join(" ▶ ")
	throw new Error(`Duplicate test name ${name} in same file: ${filePath}`)
}


const suite = new Suite()
const globSophi = {suite}

// since ESM modules are cached so this should eval once
globalThis[SOPHI] = globSophi


export function group(groupName, fn) {
	suite.addGroup(groupName, fn)
}

function groupOne(groupName, fn) {
	suite.addGroup(groupName, fn, MOD.ONE)
}

function groupJust(groupName, fn) {
	suite.addGroup(groupName, fn, MOD.JUST)
}

function groupSkip(groupName, fn) {
	suite.addGroup(groupName, fn, MOD.SKIP)
}

group.one = groupOne
group.$$ = groupOne
group.just = groupJust
group.$ = groupJust
group.skip = groupSkip


export function test(title, fn) {
	suite.addRegularTest(title, fn)
}

function testOne(title, fn) {
	suite.addOneTest(title, fn)
}

function testJust(title, fn) {
	suite.addJustTest(title, fn)
}

function testSkip(title, fn) {
	suite.addSkipTest(title, fn)
}

function testTodo(title) {
	suite.addTodoTest(title)
}

test.one = testOne
test.$$ = testOne
test.just = testJust
test.$ = testJust
test.skip = testSkip
test.todo = testTodo


export {
	group as describe,
	group as topic,
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
				suite.addObjAPITest({ title: k, fn: v, groupPath: path })
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
