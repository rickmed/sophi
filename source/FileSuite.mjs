import { GLOB_SOPHI_K } from "./shared.mjs"
import { fullNameToStr } from "./stringifyFailedTests.mjs"

const M = {
	SKIP: 1,
}

const SEP = " $0ph! "
export const DUPLICATE_GROUP_MSG = "Duplicate group names: "

export class FileSuite {

	#groupID
	#tests
	#testID
	#groupNameStack
	#groupMods
	#groupNamesCache
	#onlyTest

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

		this.groups = new Map()
		this.#groupID = 1
		this.#tests = new Map()
		this.#testID = 1
		this.#groupNameStack = []
		this.failedTests = new Set()  // test objs
		this.#groupMods = new Set()    // M.SKIP | ...
		this.#groupNamesCache = new Map()  // fullGroupName -> groupID
	}

	openGroup(name, fn, mod) {

		const gropNameStack = this.#groupNameStack

		gropNameStack.push(name)

		checkDuplicateNestedGroupNames.call(this)

		if (mod) {
			this.#groupMods.add(mod)
		}

		fn()

		this.#groupMods.delete(mod)
		gropNameStack.pop()


		function checkDuplicateNestedGroupNames() {
			if (this.#groupNamesCache.get(this.#fullGroupName(gropNameStack))) {
				throw new Error(DUPLICATE_GROUP_MSG + fullNameToStr(gropNameStack))
			}
		}
	}

	addRegularTest(name, fn) {

		if (this.onlyUsed) {
			return
		}

		if (this.#groupMods.has(M.SKIP)) {
			this.addSkipTest(name)
			return
		}

		this.addTest(name, fn)
	}

	addOnlyTest(name, fn) {
		this.onlyUsed = true
		this.#onlyTest = this.addTest(name, fn)
	}

	addSkipTest() {
		if (!this.n_Skip) this.n_Skip = 0
		this.n_Skip++
	}

	addTodoTest() {
		if (!this.n_Todo) this.n_Todo = 0
		this.n_Todo++
	}

	addTest(name, fn, groupNameStack = this.#groupNameStack) {
		const groupID = this.#group(groupNameStack)
		return this.#addNewTest(name, fn, groupID)
	}

	#addNewTest(name, fn, groupID) {
		const ID = this.#testID++
		let newTest = {ID, name, fn, g: groupID}
		this.#tests.set(ID, newTest)
		return newTest
	}

	#group(groupNameStack) {
		const groupCacheName = this.#fullGroupName(groupNameStack)
		let groupID = this.#groupNamesCache.get(groupCacheName)
		if (!groupID) {
			const ID = this.#groupID++
			const newGroup = {ID, tests: new Set(), namePath: groupNameStack.slice()}
			this.groups.set(ID, newGroup)
			this.#groupNamesCache.set(groupCacheName, ID)
			groupID = ID
		}
		return groupID
	}

	#fullGroupName(groupNameStack) {
		return groupNameStack.join(SEP)
	}

	get tests() {

		const onlyTest = this.#onlyTest

		if (onlyTest) {

			this.#tests = new Map([
				[onlyTest.ID, onlyTest],
			])

			const testGroup = this.groups.get(onlyTest.g)
			this.groups = new Map([
				[testGroup.ID, testGroup],
			])
		}

		return this.#tests
	}

	testFailed(test, err) {
		test.err = err
		this.failedTests.add(test)
	}

	get n_Tests() {
		return this.#tests.size
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
	globalThis[GLOB_SOPHI_K].fileSuite.openGroup(groupName, fn, M.SKIP)
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


	function _objToSuite(obj, gropNameStack) {

		for (const k in obj) {

			const v = obj[k]

			if (typeof v === "function") {
				const testFn = v
				const testName = k
				fileSuite.addTest(testName, testFn, gropNameStack)
				continue
			}
			else {
				const groupName = k
				gropNameStack.push(groupName)
				_objToSuite(v, gropNameStack)
				gropNameStack.pop()
			}
		}
	}
}
