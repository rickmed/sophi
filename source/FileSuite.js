import { GLOB_SOPHI_K } from "./utils.js"

const MOD = {
	ONLY: 1,
	SKIP: 2,
}

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
		this.#groupStack = [{top: true}]    // top-level group (no group)
		this.failedTests = new Set()
	}

	#resetSuite() {
		this.groups = new Map()
		this.#groupID = 1
		this.tests = new Map()
		this.#testID = 1
	}

	openGroup(name, fn, mod) {

		if (mod === MOD.ONLY) {
			this.#resetSuite()
		}

		this.#groupStack.push({ name, mod })

		fn()

		if (mod === MOD.ONLY) {
			this.onlyUsed = true
		}

		this.#groupStack.pop()
	}

	addRegularTest(name, fn) {

		if (this.onlyUsed) {
			return
		}

		if (this.#isLowestAncestorMod(MOD.SKIP)) {
			this.addSkipTest(name)
			return
		}

		this.#addTest(name, fn)
	}

	addOnlyTest(name, fn) {
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

		let currGroup = groupStack.at(-1)

		if (!currGroup.group) { 
			const ID = this.#groupID++
			const namePath = currGroup.top ? [] : groupStack.map(g => g.name)
			const newGroup = {ID, namePath, tests: new Set()}
			this.groups.set(ID, newGroup)
			currGroup.group = newGroup
		}

		const {group} = currGroup

		const testID = this.#testID++
		group.tests.add(testID)
		this.tests.set(testID, { ID: testID, name, fn, g: group.ID })
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

function groupOnly(groupName, fn) {
	globalThis[GLOB_SOPHI_K].fileSuite.openGroup(groupName, fn, MOD.ONLY)
}

function groupSkip(groupName, fn) {
	globalThis[GLOB_SOPHI_K].fileSuite.openGroup(groupName, fn, MOD.SKIP)
}

group.only = groupOnly
group.$ = groupOnly
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

	const suite = new FileSuite()

	_objToSuite(objSuite, [])

	return suite.pullSuite()


	function _objToSuite(obj, path) {

		for (const k in obj) {

			const v = obj[k]

			if (typeof v === "function") {
				suite.addObjAPITest({ name: k, fn: v, groupStack: path })
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
