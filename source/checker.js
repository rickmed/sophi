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
export const CHECK_FAIL = "ERR_SOPHI_CHECK"

function _CheckErr(op, message, received, expected) {
	return {
		op, message, received, expected,
		code: CHECK_FAIL,
		stack: Error().stack
	}
}


export const OP_EQ = "Equal"
export const OP_EQ_MSG = "expected values to be Deeply Equal"

export function eq(rec, exp, userMsg) {
	if (!isDeepEqual(rec, exp)) {
		throw _CheckErr(OP_EQ, userMsg || OP_EQ_MSG, rec, exp)
	}
}


export const OP_NOT_EQ = "Not Equal"
export const OP_NOT_EQ_MSG = "expected values to NOT be Deeply Equal"

export function notEq(rec, exp, userMsg) {
	if (isDeepEqual(rec, exp)) {
		throw _CheckErr(OP_NOT_EQ, userMsg || OP_NOT_EQ_MSG, rec, exp)
	}
}


export const OP_IS = "==="
export const OP_IS_MSG = "expected values to be ==="

export function is(rec, exp, userMsg) {
	if (rec !== exp) {
		throw _CheckErr(OP_IS, userMsg || OP_IS_MSG, rec, exp)
	}
}


export const OP_NOT_IS = "!=="
export const OP_NOT_IS_MSG = "expected values to be !=="

export function isNot(rec, exp, userMsg) {
	if (rec === exp) {
		throw _CheckErr(OP_NOT_IS, userMsg || OP_NOT_IS_MSG, rec, exp)
	}
}


export const OP_THROW = "Throws"
export const OP_THROW_MSG = "expected function to Throw"

export function throws(fn, userMsg) {
	try {
		fn()
		const msg = userMsg || OP_THROW_MSG
		throw _CheckErr(OP_THROW, msg, undefined, undefined)
	} catch (e) {
		return e
	}
}


export const OP_NOT_THROW = "Not Throws"
export const OP_NOT_THROW_MSG = "expected function to NOT Throw"

export function notThrows(fn, userMsg) {
	try {
		fn()
	} catch (e) {
		const msg = userMsg || OP_NOT_THROW_MSG
		throw _CheckErr(OP_NOT_THROW, msg, e, null)
	}
}
