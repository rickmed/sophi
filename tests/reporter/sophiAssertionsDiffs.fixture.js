import { check_Eq, check_is } from "../../source/checker.js"

export const tests = {
	"Deep Diffs"() {

		const symb1 = Symbol("k2")

		const rec = {
			[symb1]: "A",
			k2: {
				k: true
			},
		}

		const exp = {
			[symb1]: "AB",
			k3: 1
		}

		check_Eq(rec, exp)
	},
	"Simple Diffs"() {

		const rec = 22
		const exp = 11

		check_is(rec, exp)
	}
}
