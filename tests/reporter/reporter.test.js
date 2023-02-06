import { describe, test, expect } from "vitest"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { report, toHuman } from "../../source/reporter.js"
import { run } from "../../source/runner.js"
import { setColorsProto } from "../../source/colors.js"

const NL = "\n"
const INDENT = " ".repeat(3)
const TABLE_PADDING = " "
const TABLE_SEP = TABLE_PADDING + "\x1B[90m│\x1B[39m" + TABLE_PADDING
setColorsProto()
const SEP = (" | ").dim


describe("report()", () => {

	test("prints a base test suite correctly", async () => {

		const suites = [
			"./sophiAssertions.fixture.js",
			"./passedTests.fixture.js",
			"./nonSophiAssertion.fixture.js",
			"./passedTests2.fixture.js",
		]

		const expectedSpecs = [
			{
				FailPathLoc: "tests/reporter/sophiAssertions.fixture.js:5:3",
				TestTitle: "Test title",
				AssertionZone: [
					INDENT + `    4:    "Test title"() {`.dim + NL,
					INDENT + ("  > ".red + "5:       check_Eq(23099, 131)").thick + NL,
					INDENT + `    6:    },`.dim + NL,
				],
				ErrorDiagnosticsSophi: [
					INDENT + "Expected to be Deeply Equal".yellow.thick + NL,
					INDENT + NL,
					INDENT + INDENT + `${"2".underline}3${"0".underline}${"99".underline}`.red + TABLE_SEP + `${"1".underline}3${"1".underline}`.green + NL,
				]
			},
			{
				FailPathLoc: "tests/reporter/sophiAssertions.fixture.js:8:3",
				TestTitle: "Test title 2",
				AssertionZone: [
					INDENT + `    7:    "Test title 2"() {`.dim + NL,
					INDENT + ("  > ".red + `8:       check_Eq({k1: 10, k3: {kk3: true}}, {k1: 11, k2: "k2"}, "user message")`).thick + NL,
					INDENT + `    9:    },`.dim + NL,
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
				]
			},
			{
				FailPathLoc: "tests/reporter/sophiAssertions.fixture.js:11:3",
				TestTitle: "Test title 3",
				AssertionZone: [
					INDENT + `    10:    "Test title 3"() {`.dim + NL,
					INDENT + ("  > ".red + "11:       check_Eq(230, 13199)").thick + NL,
					INDENT + `    12:    },`.dim + NL,
				],
				ErrorDiagnosticsSophi: [
					INDENT + "Expected to be Deeply Equal".yellow.thick + NL,
					INDENT + NL,
					INDENT + INDENT + `${"2".underline}3${"0".underline}`.red + TABLE_SEP + `${"1".underline}3${"1".underline}${"99".underline}`.green + NL,
				]
			},
			{
				FailPathLoc: "tests/reporter/nonSophiAssertion.fixture.js:5:13",
				TestTitle: "Example test title",
				AssertionZone: [
					INDENT + `    4:    "Example test title"() {`.dim + NL,
					INDENT + ("  > ".red + "5:       expect(1).toBe(2)").thick + NL,
					INDENT + `    6:    },`.dim + NL,
				],
			}
		]

		const logs = await setup(suites)

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

			expect(logs[++i]).toBe(passedTest("tests/reporter/passedTests.fixture.js", "2 Tests"))
			expect(logs[++i]).toBe(passedTest("tests/reporter/passedTests2.fixture.js", "1 Test"))

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
				check_ErrMessage(TestTitle)
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

			function check_ErrMessage(TestTitle) {
				rec = logs[++i]
				exp = INDENT + TestTitle.yellow.thick + NL
				expect(rec).toBe(exp)
			}

			function check_AssertionZone(AssertionZone) {
				checkMultLines(AssertionZone)
			}

			function check_ErrDiagnosticsSophi(ErrorDiagnosticsSophi) {
				checkMultLines(ErrorDiagnosticsSophi)
			}

			function check_ErrStackSophi() {
				rec = logs[++i].startsWith(INDENT + "\x1B[2mat ")
				exp = true
				expect(rec).toBe(exp)
			}

			function checkMultLines(expectedLines) {
				const expectedLinesLength = expectedLines.length
				rec = logs.slice(++i, i += expectedLinesLength)
				exp = expectedLines
				expect(rec).toEqual(exp)
				i--
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

			rec = logs[++i]
			exp = INDENT + "   Files  ".dim + `2 Failed`.red + SEP + `2 Passed`.green + SEP + `4 Total` + NL
			expect(rec).toBe(exp)

			rec = logs[++i]
			exp = INDENT + "   Tests  ".dim + `4 Failed`.red + SEP + `3 Passed`.green + SEP + `7 Total` + NL
			expect(rec).toBe(exp)

			rec = logs[++i].startsWith(INDENT + "Duration".dim + "  ")
			exp = true
			expect(rec).toBe(exp)
		}
	})


	test("prints diffs correctly", async () => {

		const suites = ["./sophiAssertionsDiffs.fixture.js"]

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


	async function setup(fixturesPaths, reportOpts) {

		const rootDir = process.cwd()
		// results :: [fileSuitePath, contents, tests, fileSuitePath, contents...]
		const results = await Promise.all(fixturesPaths.flatMap(path =>
			[
				Promise.resolve(pathFromRootDir(path, rootDir)),
				readFile(new URL(path, import.meta.url), "utf8"),
				import(path),
			]
		))

		let suite = []
		let fileSuite
		for (let i = 0; i < results.length; i++) {
			const x = results[i]
			if (i % 3 === 0) {
				fileSuite = {}
				fileSuite.file_path = x
			}
			if (i % 3 === 1) {
				fileSuite.file_contents = x
			}
			if (i % 3 === 2) {
				fileSuite.tests = x.tests
				suite.push(fileSuite)
			}
		}

		const suiteResults = run(suite)

		const origStdOutWrite = process.stdout.write

		let logs = []

		process.stdout.write = function myWrite(x) {
			logs.push(x)
		}

		process.stdout._$cols = process.stdout.columns
		process.stdout.columns = 160

		report(suiteResults, reportOpts)

		process.stdout.write = origStdOutWrite

		setColorsProto()

		return logs


		function pathFromRootDir(relPath, rootPath) {

			const rootDir = rootPath.split(path.sep).pop()
			const __dirname = path.dirname(fileURLToPath(import.meta.url))

			let foundRootDir = false
			let pathToCurrModule = []
			for (const dir of __dirname.split(path.sep)) {
				if (foundRootDir) {
					pathToCurrModule.push(dir)
					continue
				}
				if (dir === rootDir) foundRootDir = true
			}

			return path.join(...pathToCurrModule, relPath)
		}
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
