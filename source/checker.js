import { dequal as isDeepEqual } from "dequal"

export const CHECK_FAILED = "ERR_SOPHI_CHECK"
/*
{
	code: CHECK_FAILED,
	op: "Deep Equal",
	message: "Expected to be Deeply Equal",
	received:: a,
	expected:: b,
	userMsg:: true | false,
	stack:: string
}
*/
function _CheckErr(op, userMsg, received, expected, opMsg) {
	return {
		op, received, expected,
		message: userMsg || opMsg,
		userMsg: userMsg ? true : false,
		code: CHECK_FAILED,
		stack: Error().stack
	}
}


export const OP_EQ = "Deep Equal"
export const OP_EQ_MSG = "Expected to be Deeply Equal"

export function check_Eq(rec, exp, userMsg) {
	if (!isDeepEqual(rec, exp)) {
		throw _CheckErr(OP_EQ, userMsg, rec, exp, OP_EQ_MSG)
	}
}


export const OP_NOTEQ = "NOT Deep Equal"
export const OP_NOTEQ_MSG = "Expected NOT to be Deeply Equal"

export function check_NotEq(rec, exp, userMsg) {
	if (isDeepEqual(rec, exp)) {
		throw _CheckErr(OP_NOTEQ, userMsg, rec, exp, OP_NOTEQ_MSG)
	}
}


export const OP_IS = "Object.is"
export const OP_IS_MSG = "Expected to be the same (Object.is)"

export function check_is(rec, exp, userMsg) {
	if (rec !== exp) {
		throw _CheckErr(OP_IS, userMsg, rec, exp, OP_IS_MSG)
	}
}


export const OP_ISNOT = "!Object.is"
export const OP_ISNOT_MSG = "Expected NOT to be the same (Object.is)"

export function check_isNot(rec, exp, userMsg) {
	if (rec === exp) {
		throw _CheckErr(OP_ISNOT, userMsg, rec, exp, OP_ISNOT_MSG)
	}
}


export const OP_THROWS = "Throws"
export const OP_THROWS_MSG = "Expected function to Throw"

export function check_Throws(fn, userMsg) {
	try {
		fn()
		throw _CheckErr(OP_THROWS, userMsg, undefined, undefined, OP_THROWS_MSG)
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
		throw _CheckErr(OP_NOTTHROWS, userMsg, e, null, OP_NOTTHROWS_MSG)
	}
}
