import { _check, CONSTANTS } from "./check_core.js"
const { eq: _eq, is: _is } = _check

function equal(rec, exp, msg) {
	_eq(rec, exp, msg)
}

function notEqual(rec, exp, msg) {
	_eq(rec, exp, msg, true)
}

function is(rec, exp, msg) {
	_is(rec, exp, msg)
}

function isNot(rec, exp, msg) {
	_is(rec, exp, msg, true)
}

function check(rec) {
	return {
		equal(exp, msg) {
			_eq(rec, exp, msg)
		},
		is(exp, msg) {
			_is(rec, exp, msg)
		},
		not: {
			equal(exp, msg) {
				_eq(rec, exp, msg, true)
			},
			is(exp, msg) {
				_is(rec, exp, msg, true)
			}
		}
	}
}

// function expect(rec) {
// 	return {
// 		toEqual(exp, msg) {
// 			_eq(rec, exp, msg)
// 		},
// 		toBe(exp, msg) {
// 			_is(rec, exp, msg)
// 		},
// 		not: {
// 			toEqual(exp, msg) {
// 				_eq(rec, exp, msg, true)
// 			},
// 			toBe(exp, msg) {
// 				_is(rec, exp, msg, true)
// 			}
// 		}
// 	}
// }

export {
	equal, notEqual,
	is, isNot,
}

export {
	equal as check_Eq, notEqual as check_not_Eq,
	is as check_is, isNot as check_isNot,
}

export {
	check,
	// expect
}

export {
	CONSTANTS
}
