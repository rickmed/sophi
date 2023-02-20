import { Suite } from "../../source/suite.js"
import { fn1 } from "../utils.js"


const t = new Suite(import.meta.url)
const group = t.group.bind(t)
const test = t.test.bind(t)

group("a", async () => {
	test("test 1", fn1)
})

export const tests = t
