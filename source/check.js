export const OP = {
	CHECK: "check",
	EQ: "check_Eq",
	NOT_EQ: "check_NotEq",
	IS: "check_is",
	IS_NOT: "check_isNot",
	THROWS: "check_Throws",
	NOT_THROWS: "check_NotThrows",
	THROWS_ASYNC: "check_ThrowsAsync",
	SATISFIES: "check_satisfies",
	USER_FAIL: "check_UserFail",
}
export const MSG = {
	CHECK: "Expected to pass spec",
	EQ: "Expected to be Deeply Equal",
	NOT_EQ: "Expected NOT to be Deeply Equal",
	IS: "Expected to be the same (Object.is)",
	IS_NOT: "Expected NOT to be the same (Object.is)",
	THROWS: "Expected function to Throw",
	NOT_THROWS: "Expected function NOT to Throw",
	THROWS_ASYNC: "Expected function to Throw Async",
	SATISFIES: "Expected to pass validator function",
	USER_FAIL: "Test failed with fail()",
}

export const ERR_ASSERTION_SOPHI = "SophiAssertionError"

class CheckErr extends Error {
	constructor({exp, rec, op, msg, issues, expFn}) {
		super(msg)

		this.name = ERR_ASSERTION_SOPHI
		this.stack = Error().stack
		this.operator = op
		this.expected = exp
		this.received = rec
		if (issues) this.issues = issues
		if (expFn) this.expFn = expFn
	}
}

export const SATISFIES_NO_ANONYMOUS_MSG = "check().satifies() does not accept anonymous functions"

export function check(rec) {
	return {
		satisfies(fn, x, y) {
			if (fn.name === "" || fn.name === "anonymous") {
				throw new Error(SATISFIES_NO_ANONYMOUS_MSG)
			}
			_satisfies(rec, fn, x, y)
		},
		with(exp, userMsg) {
			_check(rec, exp, userMsg)
		},
	}
}

function _check(rec, exp, userMsg) {

	if (typeof exp === "function") {
		const args = userMsg
		const expFn = exp
		exp = expFn(args)

		const issues = getIssues(rec, exp)
		if (issues === false) {
			return
		}
		throw new CheckErr({ rec, exp, op: OP.CHECK, msg: MSG.CHECK, issues, expFn: {name: expFn.name, args}})
	}

	const issues = getIssues(rec, exp)
	if (issues === false) {
		return
	}

	throw new CheckErr({ rec, exp, op: OP.CHECK, msg: userMsg || MSG.CHECK, issues})
}

export function expect(rec) {
	return {
		toEqual(exp, userMsg) {
			_check(rec, exp, userMsg)
		},
	}
}

export function check_Eq(rec, exp, userMsg) {
	const issues = getIssues(exp, rec)

	if (issues) {
		throw new CheckErr({ rec, exp, op: OP.EQ, msg: userMsg || MSG.EQ})
	}
}

export function check_NotEq(rec, exp, userMsg) {
	if (!getIssues(rec, exp)) {
		throw new CheckErr({ rec, exp, op: OP.NOT_EQ, msg: userMsg || MSG.NOT_EQ})
	}
}

export function check_is(rec, exp, userMsg) {
	if (!Object.is(rec, exp)) {
		throw new CheckErr({ rec, exp, op: OP.IS, msg: userMsg || MSG.IS})
	}
}

export function check_isNot(rec, exp, userMsg) {
	if (Object.is(rec, exp)) {
		throw new CheckErr({ rec, exp, op: OP.IS_NOT, msg: userMsg || MSG.IS_NOT})
	}
}

export function check_Throws(fn, userMsg) {
	try {
		fn()
	} catch (e) {
		return e
	}
	throw new CheckErr({ rec: undefined, exp: undefined, op: OP.THROWS, msg: userMsg || MSG.THROWS})
}

export function check_NotThrows(fn, userMsg) {
	try {
		fn()
	} catch (e) {
		throw new CheckErr({ rec: e, exp: undefined, op: OP.NOT_THROWS, msg: userMsg || MSG.NOT_THROWS})
	}
}

export async function check_ThrowsAsync(fn, userMsg) {
	try {
		await fn()
	} catch (e) {
		return e
	}
	throw new CheckErr({ rec: undefined, exp: undefined, op: OP.THROWS_ASYNC, msg: userMsg || MSG.THROWS_ASYNC})
}

export function fail(userMsg, {rec, exp}) {
	throw new CheckErr({ rec, exp, op: OP.USER_FAIL, msg: userMsg || MSG.USER_FAIL})
}


function _satisfies(rec, fn, fnArgs, userMsg) {

	if (typeof fnArgs === "string") {
		userMsg = fnArgs
		fnArgs = undefined
	}

	let predicateReturn

	if (fnArgs) {
		predicateReturn = fn(fnArgs, rec)
	}
	else {
		predicateReturn = fn(rec)
	}

	let predicateResult

	if (Array.isArray(predicateReturn)) {
		predicateResult = predicateReturn[0]
		// if predicate returns a message, it overwrites the passed msg in arguments
		userMsg = predicateReturn[1]
	}
	else {
		predicateResult = predicateReturn
	}

	if (predicateResult === true) return

	throw new CheckErr({rec, exp: {validatorName: fn?.name, args: fnArgs, userMsg}, op: OP.SATISFIES, msg: MSG.SATISFIES})
}

function Satisfies(args) {
	this.args = args
}
export function satisfies(...args) {
	return new Satisfies(args)
}

function Lossy(v, type) {
	this.v = v
	this.type = type
}

export function lossy(objOrMap) {
	let type = isObjOrMap(objOrMap, "lossy()")
	return new Lossy(objOrMap, type)
}

function Strict(v, type) {
	this.v = v
	this.type = type
}

export function strict(objOrMap) {
	let type = isObjOrMap(objOrMap, "strict()")
	return new Strict(objOrMap, type)
}


export const EMPTY = Symbol("empty")

function Diff_Leaf(rec, exp) {
	return { type: "Leaf", rec, exp }
}
function Diff_Obj(diffs) {
	return { type: "Object", diffs }
}
function Diff_Map(diffs) {
	return { type: "Map", diffs }
}
function Diff_Arr(diffs) {
	return { type: "Array", diffs }
}
function Diff_Satisfies(satifiesErr) {
	let obj = { type: "Satisfies", ...satifiesErr }
	const exp = obj.expected
	const rec = obj.received
	delete obj.expected
	delete obj.received
	obj.exp = exp
	obj.rec = rec
	obj.message = satifiesErr.message
	return obj
}

export function getIssues(rec, exp, {isLossy = false} = {}) {

	const exp_ctor = exp?.constructor

	if (exp_ctor === Satisfies) {
		try {
			_satisfies(rec, ...exp.args)
			return false
		}
		catch (e) {
			return Diff_Satisfies(e)
		}
	}

	if (exp_ctor === Lossy) {
		const type = exp.type
		exp = exp.v
		return type === "obj" ? getIssuesObj(rec, exp, {isLossy: true}) : getIssuesMap(rec, exp, {isLossy: true})
	}

	// overwrites isLossy option if strict() is used
	if (exp_ctor === Strict) {
		const type = exp.type
		exp = exp.v
		return type === "obj" ? getIssuesObj(rec, exp) : getIssuesMap(rec, exp)
	}

	let type_rec = getType(rec)
	let type_exp = getType(exp)

	if (type_rec !== type_exp) {
		return Diff_Leaf(rec, exp)
	}

	let type = type_rec

	if (isTypePrimitiveOrFn(type)) {
		return Object.is(rec, exp) ? false : Diff_Leaf(rec, exp)
	}

	if (type === "[object Date]") {
		return Object.is(rec.getTime(), exp.getTime()) ? false : Diff_Leaf(rec, exp)
	}

	if (type === "[object RegExp]") {
		return Object.is(rec.toString(), exp.toString()) ? false : Diff_Leaf(rec, exp)
	}

	if (type === "[object Set]") {
		return getIssuesSet(rec, exp)
	}

	if (type === "[object Map]") {
		return getIssuesMap(rec, exp, {isLossy})
	}

	if (type === "[object Array]") {
		return getIssuesArr(rec, exp)
	}

	if (typeof rec === "object" && typeof exp === "object") {
		return getIssuesObj(rec, exp, {isLossy})
	}

	return Diff_Leaf(rec, exp)


	function getIssuesObj(rec, exp, {isLossy = false} = {}) {

		let diffs = new Map()

		fillDiffs(rec, exp, true)
		fillDiffs(exp, rec, false)

		return diffs.size > 0 ? Diff_Obj(diffs) : false

		function fillDiffs(a, b, iterating_rec) {

			const Ks = sortKs(a)
			// console.log(Ks)
			for (const k of Ks) {

				const aVal = a[k]
				const bVal = b[k]

				if (Object.hasOwn(b, k)) {

					// skip if k is common for a and b (already processed by a)
					if (!iterating_rec && diffs.has(k)) {
						continue
					}

					const res = getIssues(aVal, bVal, { isLossy })

					if (res !== false) {
						diffs.set(k, res)
					}
				}
				else {  // a's k does not exist in b

					if (iterating_rec && isLossy && bVal?.constructor !== Strict) {
						continue
					}

					diffs.set(k, iterating_rec ? Diff_Leaf(aVal, EMPTY) : Diff_Leaf(EMPTY, aVal))
				}
			}
		}
	}

	function getIssuesMap(rec, exp, {isLossy = false} = {}) {

		let diffs = new Map()

		fillDiffs(rec, exp, true)
		fillDiffs(exp, rec, false)

		return diffs.size > 0 ? Diff_Map(diffs) : false

		function fillDiffs(a, b, iterating_rec) {

			const Ks = sortKs(a)
			for (const k of Ks) {

				const aVal = a.get(k)
				const bVal = b.get(k)

				if (b.has(k)) {

					// skip if k is common for a and b (already processed by a)
					if (!iterating_rec && diffs.has(k)) {
						continue
					}

					const res = getIssues(aVal, b.get(k), { isLossy })

					if (res !== false) {
						diffs.set(k, res)
					}
				}

				else {  // a's k does not exist in b

					if (iterating_rec && isLossy && bVal?.constructor !== Strict) {
						continue
					}

					diffs.set(k, iterating_rec ? Diff_Leaf(aVal, EMPTY) : Diff_Leaf(EMPTY, aVal))
				}
			}
		}
	}

	function getIssuesArr(rec, exp) {

		let diffs = new Map()

		let shortArr = rec, longArr = exp
		if (rec.length > exp.length) {
			shortArr = exp; longArr = rec
		}

		const shortL = shortArr.length
		for (let i = 0; i < shortL; i++) {
			const res = getIssues(rec[i], exp[i])
			if (res !== false) {
				diffs.set(i, res)
			}
		}

		const longL = longArr.length

		if (longArr == rec) {
			for (let i = shortL; i < longL; i++) {
				diffs.set(i, Diff_Leaf(longArr[i], EMPTY))
			}
		}
		else {
			for (let i = shortL; i < longL; i++) {
				diffs.set(i, Diff_Leaf(EMPTY, longArr[i]))
			}
		}

		return diffs.size > 0 ? Diff_Arr(diffs) : false
	}

	function getIssuesSet(rec, exp) {

		const uniqueInRec = new Set()
		const uniqueInExp = new Set()

		for (const x of rec) {
			if (!exp.has(x)) {
				uniqueInRec.add(x)
			}
		}
		for (const x of exp) {
			if (!rec.has(x)) {
				uniqueInExp.add(x)
			}
		}

		return uniqueInRec.size === 0 ? false : Diff_Leaf(uniqueInRec, uniqueInExp)
	}

	function sortKs(x) {

		let Ks

		if (x.constructor === Map) {
			Ks = [...x.keys()]
		}
		else {
			const Ks_ = Object.keys(x)
			const symbols = Object.getOwnPropertySymbols(x)
			Ks = [...Ks_, ...symbols]
		}

		Ks = Ks.sort((a, b) => {
			if (typeof a === "symbol" || typeof b === "symbol") {
				return 1
			}
			return a === b ? 0 : a >= b ? 1 : -1
		})

		return Ks
	}

	function isTypePrimitiveOrFn(type) {
		return (
			type === "[object Null]" || type === "[object Undefined]" ||
			type === "[object Boolean]" || type === "[object Function]" ||
			type === "[object Number]" || type === "[object BigInt]" ||
			type === "[object String]" || type === "[object Symbol]"
		)
	}
}

function isObjOrMap(objOrMap, callingFn) {

	let type_obj = isObj(objOrMap)
	let type_map = isMap(objOrMap)

	const type = type_obj || type_map

	if (type === false) {
		throw Error(`${callingFn} only accepts Object or Map`)
	}

	return type


	function isObj(x) {
		return (typeof x === "object" && !Array.isArray(x) && x !== null) ? "obj" : false
	}
	function isMap(x) {
		return getType(x) === "[object Map]" ? "map" : false
	}
}

function getType(x) {
	return Object.prototype.toString.call(x)
}
