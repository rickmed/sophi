import { describe, it, expect as expect_ } from "vitest"
import {
	eq as check_Eq,
	notEq as check_not_Eq,
	is as check_is,
	isNot as check_isNot
} from "./check.js"
import { CONSTANTS as C } from "./check_core.js"


function _assertCheckErr(err, rec, exp, opID, opMsg) {

	const errKs = new Set(Object.getOwnPropertyNames(err))
	const expKs = new Set(["type", "op", "message", "received", "expected", "stack"])
	expect_(errKs).toEqual(expKs)
	expect_(err.type).toEqual(C.FAIL)
	expect_(typeof err.stack).toEqual("string")

	expect_(err.received).toEqual(rec)
	expect_(err.received).toBe(rec)
	expect_(err.expected).toEqual(exp)
	expect_(err.expected).toBe(exp)

	expect_(err.op).toEqual(opID)
	expect_(err.message).toEqual(opMsg)
}

describe("check_Eq()", () => {

	it("should throw correct object", () => {
		const exp = ["exp"]
		const rec = ["rec"]
		try {
			check_Eq(rec, exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, C.OP_EQ, C.OP_EQ_MSG)
		}
	})

	it("should not throw", () => {
		check_Eq(["exp"], ["exp"])
	})
})

describe("check_not_Eq()", () => {

	it("should throw correct object", () => {
		const rec = ["x"]
		const exp = ["x"]
		try {
			check_not_Eq(rec, exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, C.OP_NOT_EQ, C.OP_NOT_EQ_MSG)
		}
	})

	it("should not throw", () => {
		check_not_Eq(["rec"], ["exp"])
	})
})

describe("check_is()", () => {

	it("should throw correct object", () => {
		const exp = {}
		const rec = {}
		try {
			check_is(rec, exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, C.OP_IS, C.OP_IS_MSG)
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
			_assertCheckErr(err, rec, exp, C.OP_NOT_IS, C.OP_NOT_IS_MSG)
		}
	})

	it("should not throw", () => {
		check_isNot(["rec"], ["exp"])
	})
})
