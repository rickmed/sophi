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

function _throwIt(testPassed, rec, exp, msg, op) {
	if (testPassed) return
	throw _CheckErr(rec, exp, msg, op, Error().stack)
}

function _CheckErr(received, expected, message, op, stack) {
	return {
		type: FAIL,
		received, expected, message, op, stack
	}
}


const OP_EQ = "equal"
const OP_EQ_MSG = "expected values to be deeply equal"
const OP_NOT_EQ = "not equal"
const OP_NOT_EQ_MSG = "expected values to NOT be deeply equal"

function eq(rec, exp, userMsg, not) {
	let op = OP_EQ
	let msg = userMsg || OP_EQ_MSG
	let testResult = isDeepEqual(rec, exp)
	if (not) {
		op = OP_NOT_EQ
		msg = OP_NOT_EQ_MSG
		testResult = !testResult
	}
	_throwIt(testResult, rec, exp, msg, op)
}

const OP_IS = "==="
const OP_IS_MSG = "expected values to be ==="
const OP_NOT_IS = "!=="
const OP_NOT_IS_MSG = "expected values to be !=="

function is(rec, exp, userMsg, not) {
	let op = OP_IS
	let msg = userMsg || OP_IS_MSG
	let testResult = rec === exp
	if (not) {
		op = OP_NOT_IS
		msg = OP_NOT_IS_MSG
		testResult = !testResult
	}
	_throwIt(testResult, rec, exp, msg, op)
}

const _check = {
	eq, is
}

export { _check }

export const CONSTANTS = {
	OP_EQ, OP_EQ_MSG,
	OP_NOT_EQ, OP_NOT_EQ_MSG,
	OP_IS, OP_IS_MSG,
	OP_NOT_IS, OP_NOT_IS_MSG,
	FAIL
}
