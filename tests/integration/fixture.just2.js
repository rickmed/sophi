import { group, test } from "../../source/suite.js"
import { fn1 } from "../utils.js"


group("f", () => {
	test("test f", fn1)
})

group("g", () => {
	test.just("test g", fn1)
})
