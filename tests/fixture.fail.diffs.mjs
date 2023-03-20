import { test, check } from "../source/index.mjs"

test("Deep Diffs", () => {

	const symb1 = Symbol("k2")

	const rec = {
		[symb1]: "AAIYAJ",
		k2: {
			k: true,
		},
		k4: {
			kk4: {
				kk5: 1,
			},
		},
		pp7: [2],
		set1: new Set([1, 2]),
	}

	const exp = {
		[symb1]: "AACHAG",
		k3: 1,
		k4: {
			kk4: {
				kk5: 2,
			},
		},
		pp7: [],
		set1: new Set([1, 3]),
	}

	check(rec).with(exp)
})
