import { strict as assert } from "node:assert"
import { check_is } from "../source/check.js"
import { test } from "../source/suite.js"

test("Example test title", () => {
	assert.equal(1, 1)
})

test("Example test title 2", () => {
	check_is("a", "a")
})
