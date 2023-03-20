import { topic, test, check } from "../source/index.mjs"
import { Satisfies_Str } from "../source/stringifyFailedTests.mjs"
import { exec_run_withLogTrap, existsInLog } from "./utils.mjs"


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
				"\n" +
				"  \x1B[32m\x1B[7m \x1B[27m\x1B[39m  floor:\n" +
				"  \x1B[32m\x1B[7m \x1B[27m\x1B[39m    \x1B[33m5\x1B[39m\n" +
				"  \x1B[32m\x1B[7m \x1B[27m\x1B[39m  ceiling:\n" +
				"  \x1B[32m\x1B[7m \x1B[27m\x1B[39m    \x1B[33m10\x1B[39m\n" +
				"  \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  \x1B[33m13\x1B[39m"

			check(rec).with(exp)
		}
	})

	test("passing a message as argument", () => {

		function inRange({ floor, ceiling }, rec) {
			return rec >= floor && rec <= ceiling
		}

		try {
			check(13).satisfies(inRange, { floor: 5, ceiling: 10 }, "Value should be in range")
		}
		catch (err) {

			const rec = Satisfies_Str(err)

			const exp =
				"\x1B[33mValue should be in range with arguments:\x1B[39m\n" +
				"\n" +
				"  \x1B[32m\x1B[7m \x1B[27m\x1B[39m  floor:\n" +
				"  \x1B[32m\x1B[7m \x1B[27m\x1B[39m    \x1B[33m5\x1B[39m\n" +
				"  \x1B[32m\x1B[7m \x1B[27m\x1B[39m  ceiling:\n" +
				"  \x1B[32m\x1B[7m \x1B[27m\x1B[39m    \x1B[33m10\x1B[39m\n" +
				"  \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  \x1B[33m13\x1B[39m"

			check(rec).with(exp)
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
				"\n" +
				"  \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  Some unexpected err message"

			check(rec).with(exp)
		}
	})
})

topic("stringifyFailedTests()", () => {

	test("Constructs correct diff", async () => {

		const log = await exec_run_withLogTrap(["tests/fixture.fail.diffs.mjs"])

		const str =
			"    \x1B[31m{\x1B[39m\n" +
			"    \x1B[31m  'k2': \n" +
			"    \x1B[39m    \x1B[32m\x1B[7m \x1B[27m\x1B[39m  \n" +
			"        \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  {\n" +
			"        \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m    k: \x1B[33mtrue\x1B[39m\n" +
			"        \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  }\n" +
			"    \x1B[31m  'k4': {\n" +
			"    \x1B[39m\x1B[31m    'kk4': {\n" +
			"    \x1B[39m\x1B[31m      'kk5': \n" +
			"    \x1B[39m        \x1B[32m\x1B[7m \x1B[27m\x1B[39m  \x1B[4m2\x1B[24m\x1B[4m\x1B[24m\n" +
			"            \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  \x1B[4m1\x1B[24m\n" +
			"    \x1B[31m    }\n" +
			"    \x1B[39m\x1B[31m  }\n" +
			"    \x1B[39m\x1B[31m  'pp7': [\n" +
			"    \x1B[39m\x1B[31m    0: \n" +
			"    \x1B[39m      \x1B[32m\x1B[7m \x1B[27m\x1B[39m  \n" +
			"          \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  \x1B[33m2\x1B[39m\n" +
			"    \x1B[31m  ]\n" +
			"    \x1B[39m\x1B[31m  'set1': \n" +
			"    \x1B[39m    \x1B[32m\x1B[7m \x1B[27m\x1B[39m  Set(1) {\n" +
			"        \x1B[32m\x1B[7m \x1B[27m\x1B[39m    \x1B[33m3\x1B[39m\n" +
			"        \x1B[32m\x1B[7m \x1B[27m\x1B[39m  }\n" +
			"        \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  Set(1) {\n" +
			"        \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m    \x1B[33m2\x1B[39m\n" +
			"        \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  }\n" +
			"    \x1B[31m  Symbol(k2): \n" +
			"    \x1B[39m    \x1B[32m\x1B[7m \x1B[27m\x1B[39m  AA\x1B[4mCH\x1B[24mA\x1B[4mG\x1B[24m\x1B[4m\x1B[24m\n" +
			"        \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  AA\x1B[4mIY\x1B[24mA\x1B[4mJ\x1B[24m\n" +
			"    \x1B[31m  'k3': \n" +
			"    \x1B[39m    \x1B[32m\x1B[7m \x1B[27m\x1B[39m  \x1B[33m1\x1B[39m\n" +
			"        \x1B[31m\x1B[7m▓\x1B[27m\x1B[39m  \n"

		check(log).satisfies(existsInLog, {str})
	})
})
