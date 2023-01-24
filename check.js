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

function _throwIt(testPassed, op) {
	if (testPassed) return

	const checkErr = Object.assign({
		type: FAIL,
		stack: Error().stack,
	}, op)

	throw checkErr
}

function _upsert_msg_opID(Op, opID, opMsg) {
	Op.op = opID
	Op.message = Op.message || opMsg
}

const OP_EQ_ID = "equal"
const OP_EQ_MSG = "expected values to be deeply equal"
const OP_NOTEQ_ID = "not equal"
const OP_NOTEQ_MSG = "expected values to NOT be deeply equal"

function _eq(op, not) {
	let opID = OP_EQ_ID
	let msg = OP_EQ_MSG
	let testResult = isDeepEqual(op.expected, op.received)
	if (not) {
		opID = OP_NOTEQ_ID
		msg = OP_NOTEQ_MSG
		testResult = !testResult
	}
	_upsert_msg_opID(op, opID, msg)
	_throwIt(testResult, op)
}

const OP_IS_ID = "==="
const OP_IS_MSG = "expected values to be ==="
const OP_ISNOT_ID = "!=="
const OP_ISNOT_MSG = "expected values to be !=="

function _is(op, not) {
	let opID = OP_IS_ID
	let msg = OP_IS_MSG
	let testResult = isDeepEqual(op.expected, op.received)
	if (not) {
		opID = OP_ISNOT_ID
		msg = OP_ISNOT_MSG
		testResult = !testResult
	}
	_upsert_msg_opID(op, opID, msg)
	_throwIt(testResult, op)
}

function Op(received, expected, message) {
	return {received, expected, message}
}

function check(rec) {
	return {
		equal(exp, msg) {
			_eq(Op(rec, exp, msg))
		},
		is(exp, msg) {
			_is(Op(rec, exp, msg))
		},
		not: {
			equal(exp, msg) {
				_eq(Op(rec, exp, msg), true)
			},
			is(exp, msg) {
				_is(Op(rec, exp, msg), true)
			}
		}
	}
}

function equal(rec, exp, msg) {
	_eq(Op(rec, exp, msg))
}

function notEqual(rec, exp, msg) {
	_eq(Op(rec, exp, msg), true)
}

function is(rec, exp, msg) {
	_is(Op(rec, exp, msg))
}

function isNot(rec, exp, msg) {
	_is(Op(rec, exp, msg), true)
}

export {
	check,
	equal, notEqual,
	is, isNot
}

export const CONSTANTS = {
	OP_EQ_ID, OP_EQ_MSG,
	OP_NOTEQ_ID, OP_NOTEQ_MSG,
	OP_IS_ID, OP_IS_MSG,
	OP_ISNOT_ID, OP_ISNOT_MSG,
	FAIL
}
