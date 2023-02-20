import { group, test } from "../../source/suite.js"
import { fn1, fn2, fn3 } from "../utils.js"


group("a", () => {
	test("test 1", fn1)
})

export const tests = {
	a: {
		["test 2"]: fn2,
	},
	["test 3"]: fn3,
}
