import { group, test } from "../source/index.js"
import { fn1 } from "./utils.js"


group("a", () => {
	test("test 1", fn1)
})

export const tests = {
	a: {
		["test 2"]: fn1,
	},
	["test 3"]: fn1,
}
