import { eq as _eq, is as _is } from "./check_core.js"

function eq(rec, exp, msg) {
	_eq(rec, exp, msg)
}

function notEq(rec, exp, msg) {
	_eq(rec, exp, msg, true)
}

function is(rec, exp, msg) {
	_is(rec, exp, msg)
}

function isNot(rec, exp, msg) {
	_is(rec, exp, msg, true)
}

export {
	eq, notEq, is, isNot,
}
