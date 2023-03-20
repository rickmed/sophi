import { group, test } from "../source/index.mjs"

group("a", () => {
	group("aa", () => {
		test("test 2", () => {
			throw new Error("some msg 2")
		})
	})
	test("test 3", () => {})
})
test("test 5", () => {
	throw new Error("some msg 5")
})
