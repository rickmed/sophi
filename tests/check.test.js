import { describe, it, check_is as _check_is_, check_Eq as _check_Eq_ } from "../source/index.js"
import {
	check, expect,
	satisfies, lossy, strict,
	check_Eq,
	check_NotEq,
	check_is,
	check_isNot,
	check_Throws,
	check_NotThrows,
	OP, MSG,
	ERR_ASSERTION_SOPHI, SATISFIES_NO_ANONYMOUS_MSG,
	getIssues, EMPTY,
} from "../source/check.js"


describe("check()", () => {

	it("basic usage", () => {
		const rec = {}
		const exp = {
			a: 1,
		}

		const err = check_Throws(() => check(rec).with(exp))

		const issues = {
			type: "Object",
			diffs: new Map([
				["a", { type: "Leaf", rec: EMPTY, exp: 1 }],
			]),
		}

		assertCheckErr(err, rec, exp, OP.CHECK, MSG.CHECK, issues)
	})

	it("works with a function returning the expected value (for better reporting)", () => {
		const rec = {}

		const myArg = 1
		function expFactory({ myArg }) {
			return {
				a: myArg,
			}
		}

		try {
			check(rec).with(expFactory, { myArg })
		}
		catch (err) {

			const issues = {
				type: "Object",
				diffs: new Map([
					["a", { type: "Leaf", rec: EMPTY, exp: 1 }],
				]),
			}

			const expFn = {
				name: "expFactory",
				args: { myArg: 1 },
			}

			assertCheckErr(err, rec, { a: 1 }, OP.CHECK, MSG.CHECK, issues, expFn)
		}
	})

	it("works with UserMsg", () => {
		const rec = {}
		const exp = {
			a: 1,
		}

		const userMsg = "some msg"

		try {
			check(rec).with(exp, userMsg)
		}
		catch (err) {

			const issues = {
				type: "Object",
				diffs: new Map([
					["a", { type: "Leaf", rec: EMPTY, exp: 1 }],
				]),
			}

			assertCheckErr(err, rec, exp, OP.CHECK, userMsg, issues)
		}
	})

	it("alias expect().toEqual()", () => {
		const rec = {}
		const exp = {
			a: 1,
		}

		const userMsg = "some msg"

		try {
			expect(rec).toEqual(exp, userMsg)
		}
		catch (err) {

			const issues = {
				type: "Object",
				diffs: new Map([
					["a", { type: "Leaf", rec: EMPTY, exp: 1 }],
				]),
			}

			assertCheckErr(err, rec, exp, OP.CHECK, userMsg, issues)
		}
	})

})

describe("getIssues()", () => {

	it("returns false for Equal structures", () => {

		let rec = getIssues(null, null)
		_check_is_(rec, false)

		rec = getIssues(undefined, undefined)
		_check_is_(rec, false)

		rec = getIssues(NaN, NaN)
		_check_is_(rec, false)

		rec = getIssues(0, 0)
		_check_is_(rec, false)

		rec = getIssues("a", "a")
		_check_is_(rec, false)

		rec = getIssues(false, false)
		_check_is_(rec, false)

		rec = getIssues(9n, 9n)
		_check_is_(rec, false)

		const fn = () => { }
		rec = getIssues(fn, fn)
		_check_is_(rec, false)

		// inclusion is compared by reference
		rec = getIssues(new Set([1]), new Set([1]))
		_check_is_(rec, false)

		rec = getIssues([1, 2], [1, 2])
		_check_is_(rec, false)

		rec = getIssues(new Map([["1", 1]]), new Map([["1", 1]]))
		_check_is_(rec, false)

		rec = getIssues({ k1: "a" }, { k1: "a" })
		_check_is_(rec, false)

		const date = new Date()
		rec = getIssues(date, date)
		_check_is_(rec, false)

		rec = getIssues(/a/, /a/)
		_check_is_(rec, false)
	})

	describe("returns correct diff for NON Equal structures", () => {

		it("different types", () => {
			let rec = getIssues(/a/, [1])
			_check_Eq_(rec, { type: "Leaf", rec: /a/, exp: [1] })
		})

		it("Date", () => {

			const date1 = new Date("1970-01-02")
			const date2 = new Date("1970-01-03")

			let rec = getIssues(date1, date2)
			_check_Eq_(rec, { type: "Leaf", rec: date1, exp: date2 })
		})

		it("RegExp", () => {
			let rec = getIssues(/a/, /b/)
			_check_Eq_(rec, { type: "Leaf", rec: /a/, exp: /b/ })
		})

		it("Leaf", () => {

			// set membership is compared referentially (not structurally)
			const objInRec = {}
			const commonObj = {}
			const userRec = new Set([1, 4, false, "commonStr", commonObj, objInRec])
			const objInExp = {}
			const userExp = new Set([1, 5, "commonStr", "hey", commonObj, objInExp])

			const rec = getIssues(userRec, userExp)

			const uniqueInRec = new Set([4, false, objInRec])
			const uniqueInExp = new Set([5, "hey", objInExp])
			const exp = { type: "Leaf", rec: uniqueInRec, exp: uniqueInExp }

			_check_Eq_(rec, exp)
		})

		it("Array", () => {

			let a = [0, [2], { k1: "a" }, 5]
			let b = [0, 4, { k1: "b" }]

			let rec = getIssues(a, b)

			let exp = {
				type: "Array",
				diffs: new Map([
					[1, { type: "Leaf", rec: [2], exp: 4 }],
					[2, {
						type: "Object",
						diffs: new Map([
							["k1", { type: "Leaf", rec: "a", exp: "b" }],
						]),
					}],
					[3, { type: "Leaf", rec: 5, exp: EMPTY }],
				]),
			}

			_check_Eq_(rec, exp)

			a = [0]
			b = [0, 2]

			rec = getIssues(a, b)
			exp = {
				type: "Array",
				diffs: new Map([
					[1, { type: "Leaf", rec: EMPTY, exp: 2 }],
				]),
			}

			_check_Eq_(rec, exp)
		})

		it("(Deep) Object", () => {

			const fn_p1 = () => 1
			const fn_p2 = () => 2
			const p5 = Symbol("p5")
			const p6 = Symbol("p6")
			const p8 = Symbol("p8")
			const p9 = Symbol("p9")

			const a = {
				p1: fn_p1,
				p3: "p3",
				p4: 4,
				[p5]: p5,
				[p6]: 1,
				[p9]: 1,
				p7: {
					pp7: [1, 2],
					pp8: 65,
					set1: new Set([1, 2]),
				},
			}

			const b = {
				p2: fn_p2,
				p3: 3,
				p4: {
					pp4: "pp4",
				},
				[p6]: "a",
				[p8]: 0,
				[p9]: 1,
				p7: {
					pp7: [1],
					pp8: 65,
					set1: new Set([1, 3]),
				},
			}

			const rec = getIssues(a, b)

			const exp = {
				type: "Object",
				diffs: new Map([
					["p1", { type: "Leaf", rec: fn_p1, exp: EMPTY }],
					["p2", { type: "Leaf", rec: EMPTY, exp: fn_p2 }],
					["p3", { type: "Leaf", rec: "p3", exp: 3 }],
					["p4", { type: "Leaf", rec: 4, exp: { pp4: "pp4" } }],
					[p5, { type: "Leaf", rec: p5, exp: EMPTY }],
					[p6, { type: "Leaf", rec: 1, exp: "a" }],
					[p8, { type: "Leaf", rec: EMPTY, exp: 0 }],
					["p7", {
						type: "Object",
						diffs: new Map([
							["pp7", {
								type: "Array",
								diffs: new Map([
									[1, { type: "Leaf", rec: 2, exp: EMPTY }],
								]),
							}],
							["set1", { type: "Leaf", rec: new Set([2]), exp: new Set([3]) }],
						]),
					}],
				]),
			}

			_check_Eq_(rec, exp)
		})

		it("Map", () => {

			const fn = () => { }
			const sym = Symbol()

			let userRec = new Map([
				["a", "b"],
				[fn, 2],
				[sym, 3],
				[1, { k1: "a" }],
			])

			const fn2 = () => { }
			const objAsK = { k3: "f" }
			let userExp = new Map([
				["a", "c"],
				[fn, 4],
				["c", 3],
				[1, { k1: "a", k2: "e" }],
				[objAsK, fn2],
			])

			const rec = getIssues(userRec, userExp)

			const exp = {
				type: "Map",
				diffs: new Map([
					["a", { type: "Leaf", rec: "b", exp: "c" }],
					[fn, { type: "Leaf", rec: 2, exp: 4 }],
					[sym, { type: "Leaf", rec: 3, exp: EMPTY }],
					["c", { type: "Leaf", rec: EMPTY, exp: 3 }],
					[1, {
						type: "Object",
						diffs: new Map([
							["k2", { type: "Leaf", rec: EMPTY, exp: "e" }],
						]),
					}],
					[objAsK, { type: "Leaf", rec: EMPTY, exp: fn2 }],
				]),
			}

			_check_Eq_(rec, exp)
		})
	})

	it("works with lossy() deeply, strict() and satisfies()", () => {

		const satisfies_rec = 15

		const user_rec = {
			both: "both",
			unEqual: 1,
			unEqualLossy: {
				unEqual: 1,
				r: "rVal",
			},
			unEqualStrict: {
				unEqual: 1,
				r: "rVal",
			},
			r: "rVal",
			range: satisfies_rec,
		}

		function inRange({ floor, ceiling }, number) {
			return [number >= floor && number <= ceiling, `Expected to be between ${floor} and ${ceiling}`]
		}
		const args = { floor: 5, ceiling: 10 }

		const user_exp = lossy({
			both: "both",
			unEqual: "one",
			unEqualLossy: {
				unEqual: "one",
			},
			unEqualStrict: strict({
				unEqual: "one",
			}),
			e: "e",
			range: satisfies(inRange, args),
		})

		const rec = getIssues(user_rec, user_exp)

		const exp = {
			type: "Object",
			diffs: new Map([
				["unEqual", { type: "Leaf", rec: 1, exp: "one" }],
				["e", { type: "Leaf", rec: EMPTY, exp: "e" }],
				["unEqualStrict", {
					type: "Object",
					diffs: new Map([
						["r", { type: "Leaf", rec: "rVal", exp: EMPTY }],
						["unEqual", { type: "Leaf", rec: 1, exp: "one" }],
					]),
				}],
				["unEqualLossy", {
					type: "Object",
					diffs: new Map([
						["unEqual", { type: "Leaf", rec: 1, exp: "one" }],
					]),
				}],
				["range", {
					type: "Satisfies",
					exp: {
						args: {
							ceiling: 10,
							floor: 5,
						},
						userMsg: "Expected to be between 5 and 10",
						validatorName: "inRange",
					},
					message: MSG.SATISFIES,
					name: "SophiAssertionError",
					operator: "check_satisfies",
					rec: 15,
				}],
			]),
		}

		check(rec).with(exp)
	})
})

describe("check().satisfies()", () => {

	describe("throws correctly if expected does not passes validator", () => {

		it("common usage", () => {

			function inRange({ floor, ceiling }, rec) {
				return rec >= floor && rec <= ceiling
			}

			const args = { floor: 5, ceiling: 10 }
			const rec = 13

			try {
				check(rec).satisfies(inRange, args)
			}
			catch (err) {

				const exp = {
					validatorName: "inRange",
					args: args,
					userMsg: undefined,
				}

				assertCheckErr(err, rec, exp, OP.SATISFIES, MSG.SATISFIES)
			}
		})

		it("passing a message as argument", () => {

			function inRange({ floor, ceiling }, rec) {
				return rec >= floor && rec <= ceiling
			}

			const args = { floor: 5, ceiling: 10 }
			const rec = 13
			const msg = "Value should be in range"

			try {
				check(rec).satisfies(inRange, args, msg)
			}
			catch (err) {

				const exp = {
					validatorName: "inRange",
					args: args,
					userMsg: msg,
				}

				assertCheckErr(err, rec, exp, OP.SATISFIES, MSG.SATISFIES)
			}
		})

		it("validator generates a message (overwrites if passed a message in arguments)", () => {

			function inRange({ floor, ceiling }, number) {
				return [number >= floor && number <= ceiling, `Expected to be between ${floor} and ${ceiling}`]
			}

			const args = { floor: 5, ceiling: 10 }
			const rec = 13

			try {
				check(rec).satisfies(inRange, args, "some msg")
			}
			catch (err) {

				const exp = {
					validatorName: "inRange",
					args: args,
					userMsg: "Expected to be between 5 and 10",
				}

				assertCheckErr(err, rec, exp, OP.SATISFIES, MSG.SATISFIES)
			}
		})

		it("validator without arguments (apart from received)", () => {

			const rec = "Some bad err"

			const includesError = err => err.includes("Error")

			try {
				check(rec).satisfies(includesError)
			}
			catch (err) {

				const exp = {
					validatorName: "includesError",
					args: undefined,
					userMsg: undefined,
				}

				assertCheckErr(err, rec, exp, OP.SATISFIES, MSG.SATISFIES)
			}
		})
	})

	it("if validator passes it should NOT throw ", () => {

		function inRange({ floor, ceiling }, rec) {
			return rec >= floor && rec <= ceiling
		}
		const args = { floor: 5, ceiling: 10 }

		const rec = 8

		check(rec).satisfies(inRange, args)
	})

	it("throws if trying to pass an anonymous function", () => {

		try {
			check("").satisfies(err => err.includes("Error"))
		}
		catch (err) {
			check_is(err.message, SATISFIES_NO_ANONYMOUS_MSG)
		}
	})

})

describe("check_Eq()", () => {

	it("should throw correct object", () => {
		const exp = ["exp"]
		const rec = ["rec"]
		try {
			check_Eq(rec, exp)
		} catch (err) {
			assertCheckErr(err, rec, exp, OP.EQ, MSG.EQ)
		}
	})

	it("should not throw", () => {
		check_Eq(["exp"], ["exp"])
	})

	it("works with user message", () => {
		const exp = ["exp"]
		const rec = ["rec"]
		const userMsg = "Custom message"
		try {
			check_Eq(rec, exp, userMsg)
		} catch (err) {
			assertCheckErr(err, rec, exp, OP.EQ, userMsg)
		}
	})
})

describe("check_NotEq()", () => {

	it("should throw correct object", () => {
		const rec = ["x"]
		const exp = ["x"]
		try {
			check_NotEq(rec, exp)
		} catch (err) {
			assertCheckErr(err, rec, exp, OP.NOT_EQ, MSG.NOT_EQ)
		}
	})

	it("should not throw", () => {
		check_NotEq(["rec"], ["exp"])
	})
})

describe("check_is()", () => {

	it("should throw correct object", () => {
		const exp = {}
		const rec = {}
		try {
			check_is(rec, exp)
		} catch (err) {
			assertCheckErr(err, rec, exp, OP.IS, MSG.IS)
		}
	})

	it("should not throw", () => {
		let obj = {}
		obj.a = 1
		check_is(obj, obj)
	})
})

describe("check_isNot()", () => {

	it("should throw correct object", () => {
		let rec = {}
		rec.a = 1
		let exp = rec
		try {
			check_isNot(exp, rec)
		} catch (err) {
			assertCheckErr(err, rec, exp, OP.IS_NOT, MSG.IS_NOT)
		}
	})

	it("should not throw", () => {
		check_isNot(["rec"], ["exp"])
	})
})

describe("check_Throws()", () => {

	it("should return the thrown error by the passed function", () => {
		const throwErr = {}
		const err = check_Throws(() => { throw throwErr })
		_check_is_(err, throwErr)
	})

	it("check function should throw correctly", () => {
		try {
			check_Throws(() => { })
		} catch (err) {
			assertCheckErr(err, undefined, undefined, OP.THROWS, MSG.THROWS)
		}
	})
})

describe("check_NotThrows()", () => {

	it("check function should not throw correctly", () => {
		check_NotThrows(() => { })
	})

	it("check function should throw correctly with received as the thrown Error", () => {
		const anError = { k1: 14 }
		try {
			check_NotThrows(() => { throw anError })
		} catch (err) {
			assertCheckErr(err, anError, undefined, OP.NOT_THROWS, MSG.NOT_THROWS)
		}
	})
})


function assertCheckErr(err, rec, exp, opID, msg, issues, expFn) {

	let expKs = ["name", "operator", "message", "expected", "received", "stack"]
	if (issues) {
		expKs.push("issues")
		_check_Eq_(err.issues, issues)
	}
	if (expFn) {
		expKs.push("expFn")
		_check_Eq_(err.expFn, expFn)
	}

	_check_Eq_(new Set(Object.getOwnPropertyNames(err)), new Set(expKs))

	_check_Eq_(err.message, msg)
	_check_Eq_(err.name, ERR_ASSERTION_SOPHI)
	_check_Eq_(typeof err.stack, "string")
	_check_Eq_(err.operator, opID)
	_check_Eq_(err.expected, exp)
	_check_Eq_(err.received, rec)
}
