import { topic, test, check, check_is } from "../source/index.js"
import { EMPTY } from "../source/check.js"
import { Check_Str, Satisfies_Str } from "../source/stringifyFailsData.js"

topic("buildSatisfiesMsg()", () => {

	test("basic usage", () => {

		function inRange({ floor, ceiling }, rec) {
			return rec >= floor && rec <= ceiling
		}

		try {
			check(13).satisfies(inRange, { floor: 5, ceiling: 10 })
		}
		catch (err) {

			const rec = Satisfies_Str(err)

			const exp =
				"\x1B[33mExpected to pass \x1B[1minRange\x1B[22m with arguments:\x1B[39m\n" +
				"\x1B[32m\x1B[7m \x1B[27m\x1B[39m  floor:\n" +
				"\x1B[32m\x1B[7m \x1B[27m\x1B[39m    5\n" +
				"\x1B[32m\x1B[7m \x1B[27m\x1B[39m  ceiling:\n" +
				"\x1B[32m\x1B[7m \x1B[27m\x1B[39m    10\n" +
				"\x1B[31m\x1B[7m▓\x1B[27m\x1B[39m 13"

			check_is(rec, exp)
		}
	})

	test("passing a message as argument", () => {

		function inRange({ floor, ceiling }, rec) {
			return rec >= floor && rec <= ceiling
		}

		try {
			check(13).satisfies(inRange, {floor: 5, ceiling: 10}, "Value should be in range")
		}
		catch (err) {

			const rec = Satisfies_Str(err)

			const exp =
				"\x1B[33mValue should be in range:\x1B[39m\n\x1B[31m\x1B[7m▓\x1B[27m\x1B[39m 13"

			check_is(rec, exp)
		}
	})

	test("validator generates a message (overwrites if passed a message in arguments)", () => {

		function inRange({ floor, ceiling }, number) {
			return [number >= floor && number <= ceiling, `Expected to be between ${floor} and ${ceiling}`]
		}

		try {
			check(13).satisfies(inRange, {floor: 5, ceiling: 10}, "some msg")
		}
		catch (err) {

			const rec = Satisfies_Str(err)

			const exp =
				"\x1B[33mExpected to be between 5 and 10:\x1B[39m\n\x1B[31m\x1B[7m▓\x1B[27m\x1B[39m 13"

			check_is(rec, exp)
		}
	})

	test("validator without arguments (apart from received)", () => {

		const includesError = err => err.includes("Error")

		try {
			check("Some unexpected err message").satisfies(includesError)
		}
		catch (err) {

			const rec = Satisfies_Str(err)

			const exp =
				"\x1B[33mExpected to pass \x1B[1mincludesError\x1B[22m:\x1B[39m\n" +
				"\x1B[31m\x1B[7m▓\x1B[27m\x1B[39m 'Some unexpected err message'"

			check_is(rec, exp)
		}
	})
})

topic.skip("Check_Str()", () => {

	test("(remove todo when format stabilizes) Makes correct string for reporting", () => {

		const fn_p1 = () => 1
		const fn_p2 = () => 2
		const p5 = Symbol("p5")
		const p6 = Symbol("p6")
		const p8 = Symbol("p8")

		const issues = {
			type: "Object",
			diffs: new Map([
				["p1", { type: "Leaf", rec: fn_p1, exp: EMPTY }],
				["p2", { type: "Leaf", rec: EMPTY, exp: fn_p2 }],
				["p3", { type: "Leaf", rec: "AAIYAJ", exp: "AACHAG" }],
				["p4", { type: "Leaf", rec: 2, exp: { pp4: 2 } }],
				[p5, { type: "Leaf", rec: p5, exp: EMPTY }],
				[p6, { type: "Leaf", rec: 1, exp: "a" }],
				[p8, { type: "Leaf", rec: EMPTY, exp: 0 }],
				["p7", {
					type: "Object",
					diffs: new Map([
						["pp7", {
							type: "Array",
							diffs: new Map([
								[1, { type: "Leaf", rec: 2, exp: EMPTY }],
							]),
						}],
						["set1", { type: "Leaf", rec: new Set([2]), exp: new Set([3]) }],
					]),
				}],
			]),
		}

		const str = Check_Str({issues, expFn: {name: "objSpec", args: {}}})

		return str // check something with str instead

	})

})
