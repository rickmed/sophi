import { group, test } from "../source/suite.js"
import { fn1 } from "./utils.js"


group("a", () => {
	test("test a", fn1)
})

group("b", () => {
	test.just("test b", fn1)
})
