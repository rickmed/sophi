import { readFile } from "node:fs/promises"
import { describe, test, expect } from "vitest"
import { absPathFromRel } from "../utils.js"
import { run } from "../../source/run.js"
import { report, toHuman } from "../../source/report.js"
import "../../source/colors/colors.js"

const NL = "\n"
const INDENT = " ".repeat(3)
const TABLE_PADDING = " "
const TABLE_SEP = TABLE_PADDING + "\x1B[90m│\x1B[39m" + TABLE_PADDING
const SEP = (" | ").dim


describe("report()", () => {

	test("prints a base test suite correctly", async () => {

		const testsFixtures = [
			"./fixture.fail.js",
			"./fixture.pass.mixedAssert.js",
			"./fixture.fail.nonSophiAssert.js",
			"./fixture.pass.js",
			"./fixture.todo.js",
		]

		const expectedSpecs = [
			{
				FailPathLoc: "tests/integration/fixture.fail.js:6:3",
				TestTitle: "group1 ▶ Test title",
				AssertionZone: [
					INDENT + `    5:    test("Test title", () => {`.dim + NL,
					INDENT + ("  > ".red + "6:       check_is(23099, 131)").thick + NL,
					INDENT + `    7:    })`.dim + NL,
				],
				ErrorDiagnosticsSophi: [
					INDENT + "Expected to be the same (Object.is)".yellow.thick + NL,
					INDENT + NL,
					INDENT + INDENT + `${"2".underline}3${"0".underline}${"99".underline}`.red + TABLE_SEP + `${"1".underline}3${"1".underline}`.green + NL,
				],
			},
			{
				FailPathLoc: "tests/integration/fixture.fail.js:11:2",
				TestTitle: "Test title 2",
				AssertionZone: [
					INDENT + `    10: test("Test title 2", () => {`.dim + NL,
					INDENT + ("  > ".red + `11:    check_Eq({k1: 10, k3: {kk3: true}}, {k1: 11, k2: "k2"}, "user message")`).thick + NL,
					INDENT + `    12: })`.dim + NL,
				],
				ErrorDiagnosticsSophi: [
					"   \x1B[1m\x1B[33muser message\x1B[39m\x1B[22m\n",
					INDENT + NL,
					"      \x1B[31m{\x1B[39m             \x1B[90m│\x1B[39m \x1B[32m{\x1B[39m         \n" +
					"      \x1B[31m  k1: 10,\x1B[39m     \x1B[90m│\x1B[39m \x1B[32m  k1: 11,\x1B[39m \n" +
					"      \x1B[31m  k3: {\x1B[39m       \x1B[90m│\x1B[39m \x1B[32m  k2: 'k2'\x1B[39m\n" +
					"      \x1B[31m    kk3: true\x1B[39m \x1B[90m│\x1B[39m \x1B[32m}\x1B[39m         \n" +
					"      \x1B[31m  }\x1B[39m           \x1B[90m│\x1B[39m           \n" +
					"      \x1B[31m}\x1B[39m             \x1B[90m│\x1B[39m           \n",
				],
			},
			{
				FailPathLoc: "tests/integration/fixture.fail.js:16:2",
				TestTitle: "Test title 3",
				AssertionZone: [
					INDENT + `    15:    await Promise.resolve(1)`.dim + NL,
					INDENT + ("  > ".red + "16:    check_is(230, 13199)").thick + NL,
					INDENT + `    17: })`.dim + NL,
				],
				ErrorDiagnosticsSophi: [
					INDENT + "Expected to be the same (Object.is)".yellow.thick + NL,
					INDENT + NL,
					INDENT + INDENT + `${"2".underline}3${"0".underline}`.red + TABLE_SEP + `${"1".underline}3${"1".underline}${"99".underline}`.green + NL,
				],
			},
			{
				FailPathLoc: "tests/integration/fixture.fail.nonSophiAssert.js:5:12",
				TestTitle: "Example test title",
				AssertionZone: [
					INDENT + `    4: test("Example test title", () => {`.dim + NL,
					INDENT + ("  > ".red + "5:    expect(1).toBe(2)").thick + NL,
					INDENT + `    6: })`.dim + NL,
				],
			},
		]

		const logs = await setup(testsFixtures)

		let logsIdx = 0
		let i = logsIdx

		expect(logs[i]).toBe(NL)
		i = check_PassedTests(logs, i)
		expect(logs[++i]).toBe(NL)
		expect(logs[++i]).toBe(NL)
		i = check_FailedTests(logs, i, expectedSpecs)
		expect(logs[++i]).toBe(NL)
		check_Summary(logs, i)

		cleanup()


		function check_PassedTests(logs, i) {

			expect(logs[++i]).toBe(passedTest("tests/integration/fixture.pass.mixedAssert.js", "2 Tests"))
			expect(logs[++i]).toBe(passedTest("tests/integration/fixture.pass.js", "1 Test"))

			return i

			function passedTest(path, txt) {
				return "✓".green.thick + " " + path + SEP + txt.green + NL
			}
		}

		function check_FailedTests(logs, i, specs) {

			let rec; let exp

			for (const spec of specs) {

				let { FailPathLoc, TestTitle, AssertionZone, ErrorDiagnosticsSophi } = spec

				check_PathAndLoc(FailPathLoc)
				check_nl({ indent: 0 })
				check_testTitle(TestTitle)
				check_nl({ indent: 1 })
				check_AssertionZone(AssertionZone)
				check_nl({ indent: 1 })

				if (ErrorDiagnosticsSophi) {
					check_ErrDiagnosticsSophi(ErrorDiagnosticsSophi)
					check_nl({ indent: 1 })
					check_ErrStackSophi()
				}
				else {
					check_GenericError()
				}

				check_nl({ indent: 1 })
				check_nl({ indent: 1 })
			}

			return i


			function check_PathAndLoc(FailPathLoc) {
				rec = logs[++i]
				exp = `${" Fail ".red.inverse} ${FailPathLoc.red.thick} ${"─".repeat(20).red}` + NL
				expect(rec).toBe(exp)
			}

			function check_nl({ indent }) {
				rec = logs[++i]
				exp = INDENT.repeat(indent) + NL
				expect(rec).toBe(exp)
			}

			function check_testTitle(TestTitle) {
				rec = logs[++i]
				exp = INDENT + TestTitle.yellow.thick + NL
				expect(rec).toBe(exp)
			}

			function check_AssertionZone(AssertionZone) {
				i = checkMultLines(AssertionZone, logs, i)
			}

			function check_ErrDiagnosticsSophi(ErrorDiagnosticsSophi) {
				i = checkMultLines(ErrorDiagnosticsSophi, logs, i)
			}

			function check_ErrStackSophi() {
				rec = logs[++i].startsWith(INDENT + "\x1B[2mat ")
				exp = true
				expect(rec).toBe(exp)
			}

			function check_GenericError() {
				expect(logs[++i]).toMatch(/Error/)

				while (logs[i] !== (INDENT + NL)) {
					i++
				}
				i--
			}
		}

		function check_Summary(logs, i) {

			let rec = logs[++i].startsWith(" Summary ".inverse)
			let exp = true
			expect(rec).toBe(exp)
			expect(logs[++i]).toBe(NL)

			const todoMsgs = [
				"   \x1B[34m🖊️ Todo tests: \x1B[39m\n" ,
				"      \x1B[34m● tests/integration/fixture.todo.js\x1B[39m\n",
				"         \x1B[34m◻ Test title\x1B[39m\n",
				"\n",
			]

			i = checkMultLines(todoMsgs, logs, i)

			rec = logs[++i]
			exp = INDENT + "   Files  ".dim + `2 Failed`.red + SEP + `2 Passed`.green + SEP + `1 Todo`.blue + SEP + `5 Total` + NL
			expect(rec).toBe(exp)

			rec = logs[++i]
			exp = INDENT + "   Tests  ".dim + `4 Failed`.red + SEP + `3 Passed`.green + SEP + `1 Todo`.blue + SEP + `8 Total` + NL
			expect(rec).toBe(exp)

			rec = logs[++i].startsWith(INDENT + "Duration".dim + "  ")
			exp = true
			expect(rec).toBe(exp)
		}


		function checkMultLines(expectedLines, logs, i) {
			const expectedLinesLength = expectedLines.length
			const rec = logs.slice(++i, i += expectedLinesLength)
			const exp = expectedLines
			expect(rec).toEqual(exp)
			i--
			return i
		}
	})

	test("prints diffs correctly", async () => {

		const suites = ["./fixture.fail.diffs.js"]

		const logs = await setup(suites, { printDiffs: true })

		const rec = logs.join("")

		let exp = [
			"   \n",
			"   \x1B[33mat .'k2':\x1B[39m\n",
			"      \x1B[31m{\x1B[39m         \x1B[90m│\x1B[39m \x1B[37m-\x1B[39m\n" +
			"      \x1B[31m  k: true\x1B[39m \x1B[90m│\x1B[39m  \n" +
			"      \x1B[31m}\x1B[39m         \x1B[90m│\x1B[39m  \n",
			"   \n",
			"   \x1B[33mat .'k3':\x1B[39m\n",
			"      \x1B[37m-\x1B[39m \x1B[90m│\x1B[39m \x1B[32m1\x1B[39m\n",
			"   \n",
			"   \x1B[33mat .Symbol(k2):\x1B[39m\n",
			"      \x1B[31mA\x1B[39m \x1B[90m│\x1B[39m \x1B[32mA\x1B[4mB\x1B[24m\x1B[39m\n",
			"   \n",
		].join("")

		expect(rec).toMatch(exp)

		exp = [
			"   \n",
			"   \x1B[1m\x1B[33mExpected to be the same (Object.is)\x1B[39m\x1B[22m\n",
			"   \n",
			"      \x1B[31m\x1B[4m22\x1B[24m\x1B[39m \x1B[90m│\x1B[39m \x1B[32m\x1B[4m11\x1B[24m\x1B[4m\x1B[24m\x1B[39m\n",
			"   \n",
		].join("")

		expect(rec).toMatch(exp)

		cleanup()
	})

	test("files with no tests: prints correct info", async () => {

		const fixt = [ "./fixture.noTests.js"]
		let logs = await setup(fixt)

		const rec = logs.join("")

		const exp = [
			"\n",
			"   \x1B[34m🧟‍♀️Files with no tests: \x1B[39m\n",
			"      🧟‍♂️\x1B[34mtests/integration/fixture.noTests.js\x1B[39m\n",
			"\n",
			"   \x1B[2m   Files  \x1B[22m0 Total\n",
			"   \x1B[2m   Tests  \x1B[22m0 Total\n",
		].join("")

		expect(rec).toContain(exp)
	})

	test("files with skipped files: prints correct info", async () => {

		const fixt = [ "./fixture.skippedFile.js"]
		let logs = await setup(fixt)

		const rec = logs.join("")

		const exp = [
			"\n",
			"   \x1B[2m   Files  \x1B[22m\x1B[33m1 Skipped\x1B[39m\x1B[2m | \x1B[22m1 Total\n",
			"   \x1B[2m   Tests  \x1B[22m\x1B[33m1 Skipped\x1B[39m\x1B[2m | \x1B[22m1 Total\n",
		].join("")

		expect(rec).toContain(exp)
	})


	async function setup(testFilePath_s, reportOpts) {

		testFilePath_s = testFilePath_s.map(p => absPathFromRel(import.meta.url, p))

		const [suite, fileContent] = await Promise.all([
			run(testFilePath_s),
			getFilesAndContents(testFilePath_s),
		])

		for (const { path, content } of fileContent) {
			suite.suites.get(path).file_content = content
		}

		const origStdOutWrite = process.stdout.write
		let logs = []
		process.stdout.write = function myWrite(x) {
			logs.push(x)
		}
		process.stdout._$cols = process.stdout.columns
		process.stdout.columns = 160

		report(suite, reportOpts)

		process.stdout.write = origStdOutWrite

		return logs
	}

	function cleanup() {
		process.stdout.columns = process.stdout._$cols
	}
})


test("toHuman()", () => {

	let rec = toHuman(999)
	let exp = "999ms"
	expect(rec).toEqual(exp)

	rec = toHuman(1_001)
	exp = "1.00s"
	expect(rec).toEqual(exp)

	rec = toHuman(1_011)
	exp = "1.01s"
	expect(rec).toEqual(exp)

	rec = toHuman(59_999)
	exp = "59.99s"
	expect(rec).toEqual(exp)

	rec = toHuman(60_000)
	exp = "1m 0s"
	expect(rec).toEqual(exp)

	rec = toHuman(70_000)
	exp = "1m 10s"
	expect(rec).toEqual(exp)

	rec = toHuman(3_599_999)
	exp = "59m 59s"
	expect(rec).toEqual(exp)

	rec = toHuman(3_600_000)
	exp = "1h 0m 0s"
	expect(rec).toEqual(exp)

	rec = toHuman(86_399_999)
	exp = "23h 59m 59s"
	expect(rec).toEqual(exp)

	rec = toHuman(86_400_000)
	exp = "days"
	expect(rec).toEqual(exp)
})


async function getFilesAndContents(absPaths) {
	return Promise.all(absPaths.map(async path => {
		return {
			path,
			content: await readFile(path, "utf8"),
		}
	}))
}
