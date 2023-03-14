import { strict as assert } from "node:assert"
import { test, check } from "../source/index.js"

test("Example test title", () => {
	assert.equal(1, 1)
})

test("Example test title 2", () => {
	check("a").with("a")
})
