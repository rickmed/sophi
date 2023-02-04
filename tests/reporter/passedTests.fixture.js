import { expect } from "vitest"
import { check_is } from "../../source/checker.js"

export const tests = {
	"Example test title"() {
		expect(1).toBe(1)
	},
	"Example test title 2"() {
		check_is("a", "a")
	},
}
