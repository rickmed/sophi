import { eq as check_Eq } from "./checker.js"

export const tests = {
	"This is an example title provided by the user"() {
		check_Eq(1, 2)
	},
}
