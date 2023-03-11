import { group, test } from "../source/index.js"
import { fn1 } from "./utils.js"


group("a", () => {
	test("test a", fn1)
})

group("b", () => {
	test.only("test b", fn1)
})
