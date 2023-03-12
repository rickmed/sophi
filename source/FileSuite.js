import { GLOB_SOPHI_K } from "./utils.js"

const SKIP = 1

export class FileSuite {

	#groupID
	#testID
	#groupStack

	constructor() {
		/*
		suite: {
			groups: Map {
				ID::int -> {
					ID:: int,
					namePath: ["group a", "group a.a"],
					tests: Set(testID)
					hooks?: {
						beforeAll?: fn,
						beforeEach?: fn,
						afterEach?: fn,
						afterAll?: fn,
					}
				}
			}
			tests: Map {
				ID::int -> {ID::int, name, fn, g: groupID}),
			}
		}
		*/

		this.#resetSuite()
		this.#groupStack = []
		this.failedTests = new Set()
	}

	#resetSuite() {
		this.groups = new Map()
		this.#groupID = 1
		this.tests = new Map()
		this.#testID = 1
	}

	openGroup(name, fn, mod) {

		this.#groupStack.push({ name, mod })

		fn()

		this.#groupStack.pop()
	}

	addRegularTest(name, fn) {

		if (this.onlyUsed) {
			return
		}

		if (this.#isLowestAncestorMod(SKIP)) {
			this.addSkipTest(name)
			return
		}

		this.#addTest(name, fn)
	}

	addOnlyTest(name, fn) {
		this.#resetSuite()
		this.onlyUsed = true
		this.#addTest(name, fn)
	}

	addSkipTest() {
		if (!this.n_Skip) this.n_Skip = 0
		this.n_Skip++
	}

	addTodoTest() {
		if (!this.n_Todo) this.n_Todo = 0
		this.n_Todo++
	}

	addObjAPITest({ name, fn, groupStack }) {
		this.#addTest(name, fn, groupStack)
	}

	#addTest(name, fn, groupStack) {

		groupStack = groupStack || this.#groupStack

		let currStackGroup = groupStack.at(-1)

		if (!currStackGroup) {  // file top-level (no group)
			this.#addNewTest(name, fn)
			return
		}

		if (!currStackGroup.group) {
			currStackGroup.group = this.#addNewGroup(groupStack)
		}

		// when addOnlyTest() resets suite
		if (this.groups.size === 0) {
			this.groups.set(currStackGroup.group.ID, currStackGroup.group)
		}

		this.#addNewTest(name, fn, currStackGroup.group.ID)
	}

	#addNewTest(name, fn, groupID) {
		const ID = this.#testID++
		let newTest = {ID, name, fn}
		if (groupID) {
			newTest.g = groupID
		}
		this.tests.set(ID, newTest)
		return newTest
	}

	#addNewGroup(groupStack) {
		const ID = this.#groupID++
		const newGroup = {ID, tests: new Set(), namePath: groupStack.map(g => g.name)}
		this.groups.set(ID, newGroup)
		return newGroup
	}

	#isLowestAncestorMod(mod) {
		const groupStack = this.#groupStack
		for (let i = groupStack.length - 1; i >= 0; i--) {
			if (groupStack[i].mod === mod) return true
		}
		return false
	}

	testFailed(test, err) {
		test.err = err
		this.failedTests.add(test)
	}

	get n_Tests() {
		return this.tests.size
	}

	get n_PassT() {
		return this.n_Tests - this.failedTests.size
	}

	get n_FailT() {
		return this.failedTests.size
	}

	get n_SkipT() {
		return this.n_Skip || 0
	}

	get n_TodoT() {
		return this.n_Todo || 0
	}
}


export function group(groupName, fn) {
	globalThis[GLOB_SOPHI_K].fileSuite.openGroup(groupName, fn)
}

function groupSkip(groupName, fn) {
	globalThis[GLOB_SOPHI_K].fileSuite.openGroup(groupName, fn, SKIP)
}

group.skip = groupSkip


export function test(name, fn) {
	globalThis[GLOB_SOPHI_K].fileSuite.addRegularTest(name, fn)
}

function testOnly(name, fn) {
	globalThis[GLOB_SOPHI_K].fileSuite.addOnlyTest(name, fn)
}

function testSkip(name) {
	globalThis[GLOB_SOPHI_K].fileSuite.addSkipTest(name)
}

function testTodo(name) {
	globalThis[GLOB_SOPHI_K].fileSuite.addTodoTest(name)
}

test.only = testOnly
test.$ = testOnly
test.skip = testSkip
test.todo = testTodo


export {
	group as describe,
	group as topic,
	test as it,
}


export function objToSuite(objSuite) {

	const fileSuite = new FileSuite()

	_objToSuite(objSuite, [])

	return fileSuite


	function _objToSuite(obj, path) {

		for (const k in obj) {

			const v = obj[k]

			if (typeof v === "function") {
				console.log({path})
				fileSuite.addObjAPITest({ name: k, fn: v, groupStack: path })
				continue
			}
			else {
				path.push({ groupName: k, mod: null })
				_objToSuite(v, path)
				path.pop()
			}
		}
	}
}
