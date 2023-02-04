import { dequal as isDeepEqual } from "dequal"

/*
{
	code: CHECK_FAIL
	op: 'equal'
	message: 'expected values to be deeply equal',
	received: [ 'rec' ],
	expected: [ 'exp' ],
	stack: 'Error: \n' +
	'    at _throwIt (/sophi/check.js:11:10)\n' +
}
*/
export const CHECK_FAILED = "ERR_SOPHI_CHECK"

function _CheckErr(op, message, received, expected) {
	return {
		op, message, received, expected,
		code: CHECK_FAILED,
		stack: Error().stack
	}
}


export const OP_EQ = "Deep Equal"
export const OP_EQ_MSG = "Expected to be Deeply Equal"

export function check_Eq(rec, exp, userMsg) {
	if (!isDeepEqual(rec, exp)) {
		throw _CheckErr(OP_EQ, userMsg || OP_EQ_MSG, rec, exp)
	}
}


export const OP_NOTEQ = "NOT Deep Equal"
export const OP_NOTEQ_MSG = "Expected NOT to be Deeply Equal"

export function check_NotEq(rec, exp, userMsg) {
	if (isDeepEqual(rec, exp)) {
		throw _CheckErr(OP_NOTEQ, userMsg || OP_NOTEQ_MSG, rec, exp)
	}
}


export const OP_IS = "Object.is"
export const OP_IS_MSG = "Expected to be the same (Object.is)"

export function check_is(rec, exp, userMsg) {
	if (rec !== exp) {
		throw _CheckErr(OP_IS, userMsg || OP_IS_MSG, rec, exp)
	}
}


export const OP_ISNOT = "!Object.is"
export const OP_ISNOT_MSG = "Expected NOT to be the same (Object.is)"

export function check_isNot(rec, exp, userMsg) {
	if (rec === exp) {
		throw _CheckErr(OP_ISNOT, userMsg || OP_ISNOT_MSG, rec, exp)
	}
}


export const OP_THROWS = "Throws"
export const OP_THROWS_MSG = "Expected function to Throw"

export function check_Throws(fn, userMsg) {
	try {
		fn()
		const msg = userMsg || OP_THROWS_MSG
		throw _CheckErr(OP_THROWS, msg, undefined, undefined)
	} catch (e) {
		return e
	}
}


export const OP_NOTTHROWS = "Not Throws"
export const OP_NOTTHROWS_MSG = "Expected function NOT to Throw"

export function check_NotThrows(fn, userMsg) {
	try {
		fn()
	} catch (e) {
		const msg = userMsg || OP_NOTTHROWS_MSG
		throw _CheckErr(OP_NOTTHROWS, msg, e, null)
	}
}
