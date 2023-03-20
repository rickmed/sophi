import { group, test } from "../source/index.mjs"
import { fn1 } from "./utils.mjs"


group("a", () => {
	test("test 1", fn1)
})

export const tests = {
	a: {
		["test 2"]: fn1,
	},
	["test 3"]: fn1,
}
