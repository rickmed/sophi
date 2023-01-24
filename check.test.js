import { describe, it } from "vitest"
import { check, CONSTANTS as C } from "./check.js"
import { deepEqual as assert_Eq, equal as assert_Is } from "node:assert/strict"

function _assertCheckErr(err, rec, exp, opID, opMsg) {

	const errKs = new Set(Object.getOwnPropertyNames(err))
	const expKs = new Set(["type", "op", "message", "received", "expected", "stack"])
	assert_Eq(errKs, expKs)
	assert_Eq(err.type, C.FAIL)
	assert_Eq(typeof err.stack, "string")

	assert_Eq(err.received, rec)
	assert_Is(err.received, rec)
	assert_Eq(err.expected, exp)
	assert_Is(err.expected, exp)

	assert_Eq(err.op, opID)
	assert_Eq(err.message, opMsg)
}

describe("equal()", () => {

	it.only("should throw correct object", () => {
		const exp = ["exp"]
		const rec = ["rec"]
		try {
			check(rec).equal(exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, C.OP_EQ_ID, C.OP_EQ_MSG)
		}
	})

	it("should not throw", () => {
		check(["exp"]).equal(["exp"])
	})
})

describe("not equal()", () => {

	it("should throw correct object", () => {
		const rec = ["x"]
		const exp = ["x"]
		try {
			check(rec).not.equal(exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, C.OP_NOTEQ_ID, C.OP_NOTEQ_MSG)
		}
	})

	it("should not throw", () => {
		check(["rec"]).not.equal(["exp"])
	})
})

describe("is()", () => {

	it("should throw correct object", () => {
		const exp = {}
		const rec = {}
		try {
			check(rec).is(exp)
		} catch (err) {
			_assertCheckErr(err, rec, exp, C.OP_IS_ID, C.OP_IS_MSG)
		}
	})

	it("should not throw", () => {
		let obj = {}
		obj.a = 1
		check(obj).is(obj)
	})
})

describe("not is()", () => {

	it("should throw correct object", () => {
		let rec = {}
		rec.a = 1
		let exp = rec
		try {
			check(rec).not.is(rec)
		} catch (err) {
			_assertCheckErr(err, rec, exp, C.OP_ISNOT_ID, C.OP_ISNOT_MSG)
		}
	})

	it("should not throw", () => {
		check(["rec"]).not.is(["exp"])
	})
})
