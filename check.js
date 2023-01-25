import { dequal as isDeepEqual } from "dequal"

/*
{
	type: 'CHECK_TEST_FAIL',
	op: 'equal'
	message: 'expected values to be deeply equal',
	received: [ 'rec' ],
	expected: [ 'exp' ],
	stack: 'Error: \n' +
	'    at _throwIt (/sophi/check.js:11:10)\n' +
}
*/
const FAIL = "CHECK_TEST_FAIL"

function _CheckErr(op, message, received, expected) {
	return {
		op, message, received, expected,
		type: FAIL,
		stack: Error().stack
	}
}

const OP_EQ = "Equal"
const OP_EQ_MSG = "expected values to be Deeply Equal"

function eq(rec, exp, userMsg) {
	if (!isDeepEqual(rec, exp)) {
		throw _CheckErr(OP_EQ, userMsg || OP_EQ_MSG, rec, exp)
	}
}

const OP_NOT_EQ = "Not Equal"
const OP_NOT_EQ_MSG = "expected values to NOT be Deeply Equal"

function notEq(rec, exp, userMsg) {
	if (isDeepEqual(rec, exp)) {
		throw _CheckErr(OP_NOT_EQ, userMsg || OP_NOT_EQ_MSG, rec, exp)
	}
}

const OP_IS = "==="
const OP_IS_MSG = "expected values to be ==="

function is(rec, exp, userMsg) {
	if (rec !== exp) {
		throw _CheckErr(OP_IS, userMsg || OP_IS_MSG, rec, exp)
	}
}

const OP_NOT_IS = "!=="
const OP_NOT_IS_MSG = "expected values to be !=="

function isNot(rec, exp, userMsg) {
	if (rec === exp) {
		throw _CheckErr(OP_NOT_IS, userMsg || OP_NOT_IS_MSG, rec, exp)
	}
}

export {
	eq, notEq, is, isNot,
}

export const CONSTANTS = {
	OP_EQ, OP_EQ_MSG,
	OP_NOT_EQ, OP_NOT_EQ_MSG,
	OP_IS, OP_IS_MSG,
	OP_NOT_IS, OP_NOT_IS_MSG,
	FAIL
}
