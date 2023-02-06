import { check_Eq } from "../../source/checker.js"

export const tests = {
	"Test title"() {
		check_Eq(23099, 131)
	},
	"Test title 2"() {
		check_Eq({k1: 10, k3: {kk3: true}}, {k1: 11, k2: "k2"}, "user message")
	},
	"Test title 3"() {
		check_Eq(230, 13199)
	},
}
