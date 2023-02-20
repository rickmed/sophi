import { check_Eq, check_is } from "../../source/check.js"
import { group, test } from "../../source/suite.js"

group("group1", () => {
	test("Test title", () => {
		check_is(23099, 131)
	})
})

test("Test title 2", () => {
	check_Eq({k1: 10, k3: {kk3: true}}, {k1: 11, k2: "k2"}, "user message")
})

test("Test title 3", async () => {
	await Promise.resolve(1)
	check_is(230, 13199)
})
