import { group, test } from "../source/suite.js"
import { fn1 } from "./utils.js"

group("a", () => {
	test("test 2", fn1)
})
