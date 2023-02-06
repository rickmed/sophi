export const empty = Symbol("deepDiff/empty")


export function deepDiff(a, b) {

	let type_a = typeof a
	let type_b = typeof b

	if (type_a !== type_b) {
		return [a, b]
	}

	let type = type_a

	if (
		type === "boolean" || type === "number" || type === "string" ||
		type === "symbol" || type === "bigint" || type === "function" ||
		type === "undefined" || a === null || b === null
	) {
		return Object.is(a, b) ? false : [a, b]
	}

	const a_ctor = a.constructor
	const b_ctor = b.constructor

	if (a_ctor !== b_ctor) {
		return [a, b]
	}

	const ctor = a_ctor

	if (ctor === Date) {
		return Object.is(a.getTime(), b.getTime()) ? false : [a, b]
	}

	if (ctor === RegExp) {
		return Object.is(a.toString(), b.toString()) ? false : [a, b]
	}

	if (ctor === Object) {
		return _diffDeepObj(a, b)
	}

	if (ctor === Array) {
		return _diffDeepArr(a, b)
	}

	if (ctor === Set) {
		return _diffDeepSet(a, b)
	}

	if (ctor === Map) {
		return _diffDeepMap(a, b)
	}

	return [a, b]
}


function _diffDeepObj(a, b) {

	let diffs = new Map()

	fillDiffs(a, b, true)
	fillDiffs(b, a, false)

	fillDiffsSymbols(a, b, true)
	fillDiffsSymbols(b, a, false)

	return diffs.size > 0 ? ({type: "Object", diffs}) : false


	function fillDiffs(a, b, from_a) {
		for (const k in a) {
			setKinDiff(a, b, k, from_a)
		}
	}

	function fillDiffsSymbols(a, b, from_a) {
		for (const k of Object.getOwnPropertySymbols(a)) {
			setKinDiff(a, b, k, from_a)
		}
	}

	function setKinDiff(a, b, k, from_a) {
		const b_has_k = kIn(b, k)

		if (!b_has_k) {
			diffs.set(k, from_a ? [a[k], empty] : [empty, a[k]])
		}

		else {
			const res = deepDiff(b[k], a[k])

			if (res !== false) {
				diffs.set(k, res)
			}
		}


		function kIn(obj, k) {
			return Object.hasOwn(obj, k)
		}
	}
}

function _diffDeepArr(a, b) {

	let diffs = new Map()

	let shortArr = a, longArr = b
	if (a.length > b.length) {
		shortArr = b; longArr = a
	}

	const shortL = shortArr.length
	for (let i = 0; i < shortL; i++) {
		const res = deepDiff(a[i], b[i])
		if (res !== false) {
			diffs.set(i, res)
		}
	}

	const longL = longArr.length

	if (longArr == a) {
		for (let i = shortL; i < longL; i++) {
			diffs.set(i, [longArr[i], empty])
		}
	}
	else {
		for (let i = shortL; i < longL; i++) {
			diffs.set(i, [empty, longArr[i]])
		}
	}

	return diffs.size > 0 ? ({type: "Array", diffs}) : false
}

function _diffDeepSet(a, b) {

	const diff_a = new Set()
	const diff_b = new Set()

	for (const x of a) {
		if (!b.has(x)) {
			diff_a.add(x)
		}
	}
	for (const x of b) {
		if (!a.has(x)) {
			diff_b.add(x)
		}
	}

	return diff_a.size === 0 ? false : [diff_a, diff_b]
}

function _diffDeepMap(a, b) {

	let diffs = new Map()

	fillDiffs(a, b, {from_a: true})
	fillDiffs(b, a, {from_a: false})

	return diffs.size > 0 ? ({type: "Map", diffs}) : false

	function fillDiffs(a, b, {from_a}) {

		for (const [k, aVal] of a) {

			const b_has_k = b.has(k)

			if (!b_has_k) {
				diffs.set(k, from_a ? [aVal, empty] : [empty, aVal])
			}

			else {

				if (diffs.has(k)) continue

				const res = deepDiff(aVal, b.get(k))
				if (res !== false) {
					diffs.set(k, res)
				}
			}
		}
	}
}
