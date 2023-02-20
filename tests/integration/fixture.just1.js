import { group, test } from "../../source/suite.js"
import { fn1 } from "../utils.js"

group("a", () => {
	test.just("test just 1", fn1)
})
