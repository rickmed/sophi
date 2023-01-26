import { describe, it, expect as expect_ } from "vitest"
import {
	eq as check_Eq,
	notEq as check_not_Eq,
	is as check_is,
	isNot as check_isNot,
	throws as check_Throws,
	notThrows as check_notThrows,
	OP_EQ, OP_EQ_MSG,
	OP_NOT_EQ, OP_NOT_EQ_MSG,
	OP_IS, OP_IS_MSG,
	OP_NOT_IS, OP_NOT_IS_MSG,
	OP_THROW, OP_THROW_MSG,
	OP_NOT_THROW, OP_NOT_THROW_MSG,
	CHECK_FAIL
} from "./check.js"


function _assertCheckErr(err, rec, exp, opID, opMsg) {

	const errKs = new Set(Object.getOwnPropertyNames(err))
	const expKs = new Set(["code", "op", "message", "received", "expected", "stack"])
	expect_(errKs).toEqual(expKs)
	expect_(err.code).toEqual(CHECK_FAIL)
	expect_(typeof err.stack).toEqual("string")

	expect_(err.received).toEqual(rec)
	expect_(err.received).toBe(rec)
	expect_(err.expected).toEqual(exp)
	expect_(err.expected).toBe(exp)

	expect_(err.op).toEqual(opID)
	expect_(err.message).toEqual(opMsg)
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
})


describe("notEq()", () => {

	it("should throw correct object", () => {
		const rec = ["x"]
		const exp = ["x"]
		try {
			check_not_Eq(rec, exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, OP_NOT_EQ, OP_NOT_EQ_MSG)
		}
	})

	it("should not throw", () => {
		check_not_Eq(["rec"], ["exp"])
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
			_assertCheckErr(err, rec, exp, OP_NOT_IS, OP_NOT_IS_MSG)
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

	it("should throw correctly", () => {
		try {
			check_Throws(() => {})
		} catch (err) {
			_assertCheckErr(err, undefined, undefined, OP_THROW, OP_THROW_MSG)
		}
	})

})


describe("notThrows()", () => {

	it("should throw correctly", () => {
		try {
			check_notThrows(() => {})
		} catch (err) {
			_assertCheckErr(err, undefined, undefined, OP_NOT_THROW, OP_NOT_THROW_MSG)
		}
	})

	it("should return the thrown error by the passed function", () => {
		const throwErr = {}
		const err = check_notThrows(() => { throw throwErr })
		expect_(err).toBe(throwErr)
	})

})
