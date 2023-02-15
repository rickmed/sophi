import { describe, it, expect as expect_ } from "vitest"
import {
	check_Eq, OP_EQ, OP_EQ_MSG,
	check_NotEq, OP_NOTEQ, OP_NOTEQ_MSG,
	check_is, OP_IS, OP_IS_MSG,
	check_isNot, OP_ISNOT, OP_ISNOT_MSG,
	check_Throws, OP_THROWS, OP_THROWS_MSG,
	check_NotThrows, OP_NOTTHROWS, OP_NOTTHROWS_MSG,
	ERR_SOPHI_CHECK,
} from "../source/checker.js"


function _assertCheckErr(err, rec, exp, opID, opMsg, usrMsg) {

	const errKs = new Set(Object.getOwnPropertyNames(err))
	const expKs = new Set(["code", "op", "message", "userMsg", "received", "expected", "stack"])
	expect_(errKs).toEqual(expKs)
	expect_(err.code).toEqual(ERR_SOPHI_CHECK)
	expect_(typeof err.stack).toEqual("string")

	expect_(err.received).toEqual(rec)
	expect_(err.received).toBe(rec)
	expect_(err.expected).toEqual(exp)
	expect_(err.expected).toBe(exp)

	expect_(err.op).toEqual(opID)

	if (usrMsg) {
		expect_(err.userMsg).toEqual(true)
		expect_(err.message).toEqual(usrMsg)
	}
	else {
		expect_(err.userMsg).toEqual(false)
		expect_(err.message).toEqual(opMsg)
	}

}


describe("eq()", () => {

	it("should throw correct object", () => {
		const exp = ["exp"]
		const rec = ["rec"]
		try {
			check_Eq(rec, exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, OP_EQ, OP_EQ_MSG)
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
			_assertCheckErr(err, rec, exp, OP_EQ, OP_EQ_MSG, userMsg)
		}
	})
})


describe("notEq()", () => {

	it("should throw correct object", () => {
		const rec = ["x"]
		const exp = ["x"]
		try {
			check_NotEq(rec, exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, OP_NOTEQ, OP_NOTEQ_MSG)
		}
	})

	it("should not throw", () => {
		check_NotEq(["rec"], ["exp"])
	})
})


describe("is()", () => {

	it("should throw correct object", () => {
		const exp = {}
		const rec = {}
		try {
			check_is(rec, exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, OP_IS, OP_IS_MSG)
		}
	})

	it("should not throw", () => {
		let obj = {}
		obj.a = 1
		check_is(obj, obj)
	})
})


describe("isNot()", () => {

	it("should throw correct object", () => {
		let rec = {}
		rec.a = 1
		let exp = rec
		try {
			check_isNot(exp, rec)
		} catch (err) {
			_assertCheckErr(err, rec, exp, OP_ISNOT, OP_ISNOT_MSG)
		}
	})

	it("should not throw", () => {
		check_isNot(["rec"], ["exp"])
	})
})


describe("throws()", () => {

	it("should return the thrown error by the passed function", () => {
		const throwErr = {}
		const err = check_Throws(() => { throw throwErr })
		expect_(err).toBe(throwErr)
	})

	it("check function should throw correctly", () => {
		try {
			check_Throws(() => {})
		} catch (err) {
			_assertCheckErr(err, undefined, undefined, OP_THROWS, OP_THROWS_MSG)
		}
	})
})


describe("notThrows()", () => {

	it("check function should not throw correctly", () => {
		check_NotThrows(() => {})
	})

	it("check function should throw correctly with received as the thrown Error", () => {
		const throwErr = {}
		try {
			check_NotThrows(() => { throw throwErr })
		} catch (err) {

			const errKs = new Set(Object.getOwnPropertyNames(err))
			const expKs = new Set(["code", "op", "message", "userMsg", "received", "expected", "stack"])
			expect_(errKs).toEqual(expKs)
			expect_(err.code).toEqual(ERR_SOPHI_CHECK)
			expect_(typeof err.stack).toEqual("string")

			expect_(err.received).toEqual(throwErr)
			expect_(err.received).toBe(throwErr)
			expect_(err.expected).toBe(null)

			expect_(err.op).toEqual(OP_NOTTHROWS)
			expect_(err.message).toEqual(OP_NOTTHROWS_MSG)
		}
	})
})
