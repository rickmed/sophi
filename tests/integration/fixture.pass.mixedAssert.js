import { expect } from "vitest"
import { check_is } from "../../source/check.js"
import { test } from "../../source/suite.js"

test("Example test title", () => {
	expect(1).toBe(1)
})

test("Example test title 2", () => {
	check_is("a", "a")
})
