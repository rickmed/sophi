import { test, check } from "../source/index.js"

test("Deep Diffs", () => {

	const symb1 = Symbol("k2")

	const rec = {
		[symb1]: "A",
		k2: {
			k: true,
		},
		k4: {
			kk4: {
				kk5: "no",
			},
		},
	}

	const exp = {
		[symb1]: "AB",
		k3: 1,
		k4: {
			kk4: {
				kk5: "yes",
			},
		},
	}

	check(rec).with(exp)
})
