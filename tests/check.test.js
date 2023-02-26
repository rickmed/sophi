import { describe, it, check_is as _check_is_, check_Eq as _check_Eq_ } from "../source/index.js"
import {
	check_Eq, OP_EQ, OP_EQ_MSG,
	check_NotEq, OP_NOTEQ, OP_NOTEQ_MSG,
	check_is, OP_IS, OP_IS_MSG,
	check_isNot, OP_ISNOT, OP_ISNOT_MSG,
	check_Throws, OP_THROWS, OP_THROWS_MSG,
	check_NotThrows, OP_NOTTHROWS, OP_NOTTHROWS_MSG,
	ERR_SOPHI_CHECK,
} from "../source/check.js"


function _assertCheckErr(err, rec, exp, opID, opMsg, usrMsg) {

	const errKs = new Set(Object.getOwnPropertyNames(err))
	const expKs = new Set(["code", "op", "message", "userMsg", "received", "expected", "stack"])

	_check_Eq_(errKs, expKs)
	_check_Eq_(err.code, ERR_SOPHI_CHECK)
	_check_Eq_(typeof err.stack, "string")

	_check_Eq_(err.received, rec)
	_check_is_(err.received, rec)
	_check_Eq_(err.expected, exp)
	_check_is_(err.expected, exp)

	_check_Eq_(err.op, opID)

	if (usrMsg) {
		_check_Eq_(err.userMsg, true)
		_check_Eq_(err.message, usrMsg)
	}
	else {
		_check_Eq_(err.userMsg, false)
		_check_Eq_(err.message, opMsg)
	}

}


describe("check_Eq()", () => {

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


describe("check_NotEq()", () => {

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


describe("check_is()", () => {

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


describe("check_isNot()", () => {

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


describe("check_Throws()", () => {

	it("should return the thrown error by the passed function", () => {
		const throwErr = {}
		const err = check_Throws(() => { throw throwErr })
		_check_is_(err, throwErr)
	})

	it("check function should throw correctly", () => {
		try {
			check_Throws(() => {})
		} catch (err) {
			_assertCheckErr(err, undefined, undefined, OP_THROWS, OP_THROWS_MSG)
		}
	})
})


describe("check_NotThrows()", () => {

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
			_check_Eq_(errKs, expKs)
			_check_Eq_(err.code, ERR_SOPHI_CHECK)
			_check_Eq_(typeof err.stack, "string")

			_check_Eq_(err.received, throwErr)
			_check_is_(err.received, throwErr)
			_check_is_(err.expected, undefined)

			_check_Eq_(err.op, OP_NOTTHROWS)
			_check_Eq_(err.message, OP_NOTTHROWS_MSG)
		}
	})
})
