import { describe, test, check_is, check_Eq } from "../../source/index.js"
import { readFile } from "node:fs/promises"
import { absPathFromRel } from "../utils.js"
import { run } from "../../source/run.js"
import { report, toHuman } from "../../source/report.js"
import { setColorsProto } from "../../source/colors/pure.js"

const NL = "\n"
const SEP = " | ".dim
const INDENT = " ".repeat(3)


describe.skip("report()", () => {

	test("prints a base test suite correctly", async () => {

		setColorsProto()

		const fixts = {
			passedFiles: [
				"./fixture.pass.mixedAssert.js",
				"./fixture.pass.js",
			],
			todoFiles: [
				"./fixture.todo.js",
			],
			failFiles: [
				"./fixture.fail.js",
				"./fixture.fail.nonSophiAssert.js",
			],
		}

		const logs = await setup([...fixts.passedFiles, ...fixts.failFiles, ...fixts.todoFiles])

		const failExpectedSpecs = [
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
					INDENT + INDENT + `${"2".underline}3${"0".underline}${"99".underline}`.red + `${"1".underline}3${"1".underline}`.green + NL,
				],
			},
			{
				FailPathLoc: "tests/integration/fixture.fail.js:24:2",
				TestTitle: "Test title 2",
				AssertionZone: [
					INDENT + `    23: `.dim + NL,
					INDENT + ("  > ".red + `24:    check_Eq(rec, exp, "user message")`).thick + NL,
					INDENT + `    25: })`.dim + NL,
				],
				ErrorDiagnosticsSophi: [
					"   \x1B[33mat 'k1':\x1B[39m\n",
					"      \x1B[31m1\x1B[4m0\x1B[24m\x1B[39m \x1B[90m│\x1B[39m \x1B[32m1\x1B[4m1\x1B[24m\x1B[4m\x1B[24m\x1B[39m\n",
					"   \n",
					"   \x1B[33mat 'k3':\x1B[39m\n",
					"      \x1B[31m{\x1B[39m           \x1B[90m│\x1B[39m \x1B[37m-\x1B[39m\n" +
					"      \x1B[31m  kk3: true\x1B[39m \x1B[90m│\x1B[39m  \n" +
					"      \x1B[31m}\x1B[39m           \x1B[90m│\x1B[39m  \n",
					"   \n",
					"   \x1B[33mat 'k2':\x1B[39m\n",
					"      \x1B[37m-\x1B[39m \x1B[90m│\x1B[39m \x1B[32m'k2'\x1B[39m\n",
					"   \n",
					"   \x1B[1m\x1B[33muser message\x1B[39m\x1B[22m\n",
					"   \n",
					"      \x1B[31m{\x1B[39m             \x1B[90m│\x1B[39m \x1B[32m{\x1B[39m         \n" +
					"      \x1B[31m  k1: 10,\x1B[39m     \x1B[90m│\x1B[39m \x1B[32m  k1: 11,\x1B[39m \n" +
					"      \x1B[31m  k3: {\x1B[39m       \x1B[90m│\x1B[39m \x1B[32m  k2: 'k2'\x1B[39m\n" +
					"      \x1B[31m    kk3: true\x1B[39m \x1B[90m│\x1B[39m \x1B[32m}\x1B[39m         \n" +
					"      \x1B[31m  }\x1B[39m           \x1B[90m│\x1B[39m           \n" +
					"      \x1B[31m}\x1B[39m             \x1B[90m│\x1B[39m           \n",
				],
			},
			{
				FailPathLoc: "tests/integration/fixture.fail.js:29:2",
				TestTitle: "Test title 3",
				AssertionZone: [
					INDENT + `    28:    await Promise.resolve(1)`.dim + NL,
					INDENT + ("  > ".red + "29:    check_is(230, 13199)").thick + NL,
					INDENT + `    30: })`.dim + NL,
				],
				ErrorDiagnosticsSophi: [
					INDENT + "Expected to be the same (Object.is)".yellow.thick + NL,
					INDENT + NL,
					INDENT + INDENT + `${"2".underline}3${"0".underline}`.red + `${"1".underline}3${"1".underline}${"99".underline}`.green + NL,
				],
			},
			{
				FailPathLoc: "tests/integration/fixture.fail.nonSophiAssert.js:5:9",
				TestTitle: "Example test title",
				AssertionZone: [
					INDENT + `    4: test("Example test title", () => {`.dim + NL,
					INDENT + ("  > ".red + "5:    assert.equal(1, 2)").thick + NL,
					INDENT + `    6: })`.dim + NL,
				],
			},
		]

		check_PassedSection(logs)
		check_FailedTests(logs, failExpectedSpecs)
		check_Summary(logs)

		cleanup()


		function check_PassedSection(logs) {

			let i = 0

			check_is(logs[0], NL)

			const nPassedFiles = 2
			const passedFilesSection = logs.slice(++i, i += nPassedFiles)
			const section = passedFilesSection

			let printIncluded = section.includes(toPrint("tests/integration/fixture.pass.mixedAssert.js", "2 Tests"))
			check_is(printIncluded, true)

			printIncluded = section.includes(toPrint("tests/integration/fixture.pass.js", "1 Test"))
			check_is(printIncluded, true)

			check_is(logs[i], NL)
			check_is(logs[++i], NL)

			function toPrint(path, txt) {
				return "✓".green.thick + " " + path + SEP + txt.green + NL
			}
		}

		function check_FailedTests(logs, specs) {

			let rec; let exp

			for (const spec of specs) {

				let { FailPathLoc, TestTitle, AssertionZone, ErrorDiagnosticsSophi } = spec

				const pathAndLocMsg = `${" Fail ".red.inverse} ${FailPathLoc.red.thick} ${"─".repeat(20).red}` + NL

				const logsIdx = findSection(pathAndLocMsg)
				let i = logsIdx

				check_2NL_above()
				check_nl({ indent: 0 })
				check_testTitle()
				check_nl({ indent: 1 })
				check_AssertionZone(AssertionZone)
				check_nl({ indent: 1 })

				if (ErrorDiagnosticsSophi) {
					check_ErrDiagnosticsSophi()
					check_nl({ indent: 1 })
					check_ErrStackSophi()
				}
				else {
					check_GenericError()
				}


				function check_2NL_above() {
					check_is(logs[i - 2].includes(NL), true)
					check_is(logs[i - 1].includes(NL), true)
				}
				function check_nl({ indent }) {
					rec = logs[++i]
					exp = INDENT.repeat(indent) + NL
					check_is(rec, exp)
				}
				function check_testTitle() {
					rec = logs[++i]
					exp = INDENT + TestTitle.yellow.thick + NL
					check_is(rec, exp)
				}
				function check_AssertionZone() {
					i = checkMultLines(AssertionZone, logs, i)
				}
				function check_ErrDiagnosticsSophi() {
					i = checkMultLines(ErrorDiagnosticsSophi, logs, i)
				}
				function check_ErrStackSophi() {
					rec = logs[++i].startsWith(INDENT + "\x1B[2mat ")
					exp = true
					check_is(rec, exp)
				}
				function check_GenericError() {
					check_is(logs[++i].includes("Error"), true)
				}
			}

		}

		function check_Summary(logs) {

			const logsIdx = findSection(" Summary ".inverse, true)
			let i = logsIdx

			check_3NL_above()
			check_is(logs[++i], NL)

			let rec, exp

			const todoMsgs = [
				"   \x1B[34m🖊️ Todo tests: \x1B[39m\n",
				"      \x1B[34m● tests/integration/fixture.todo.js\x1B[39m\n",
				"         \x1B[34m◻ Test title\x1B[39m\n",
				"\n",
			]

			i = checkMultLines(todoMsgs, logs, i)

			rec = logs[++i]
			exp = INDENT + "   Files  ".dim + `2 Failed`.red + SEP + `2 Passed`.green + SEP + `1 Todo`.blue + SEP + `5 Total` + NL
			check_is(rec, exp)

			rec = logs[++i]
			exp = INDENT + "   Tests  ".dim + `4 Failed`.red + SEP + `3 Passed`.green + SEP + `1 Todo`.blue + SEP + `8 Total` + NL
			check_is(rec, exp)

			rec = logs[++i].startsWith(INDENT + "Duration".dim + "  ")
			exp = true
			check_is(rec, exp)


			function check_3NL_above() {
				check_is(logs[i - 3].includes(NL), true)
				check_is(logs[i - 2].includes(NL), true)
				check_is(logs[i - 1].includes(NL), true)
			}
		}


		function findSection(str, startsWith) {

			let found = []

			const logsL = logs.length
			for (let i = 0; i < logsL; i++) {
				const val = logs[i]
				if (startsWith && val.startsWith(str)) {
					found.push({ i, val })
				}
				if (val === str) {
					found.push({ i, val })
				}
			}

			if (found.length === 0) {
				throw new Error(`section not found in report logs \n ${str}`)
			}
			if (found.length > 1) {
				throw new Error(`two identical messages printed in report logs \n ${str}`)
			}

			return found[0].i
		}
	})

	test("prints diffs correctly", async () => {

		const suites = ["./fixture.fail.diffs.js"]

		let logs = await setup(suites)
		logs = logs.join("")

		const expectedDeepDiffs = [
			"   \x1B[33mat 'k2':\x1B[39m\n",
			"              \x1B[31m{\x1B[39m      \n" +
			"      \x1B[31m  k: true\x1B[39m    \x1B[37m-\x1B[39m \n" +
			"              \x1B[31m}\x1B[39m      \n",
			"   \n",
			"   \x1B[33mat 'k4' ▶ 'kk4' ▶ 'kk5':\x1B[39m\n",
			"      \x1B[31m\x1B[4mno\x1B[24m\x1B[39m    \x1B[32m\x1B[4mye\x1B[24m\x1B[4ms\x1B[24m\x1B[39m \n",
			"   \n",
			"   \x1B[33mat 'k3':\x1B[39m\n",
			"      \x1B[37m-\x1B[39m    \x1B[32m1\x1B[39m \n",
			"   \n",
			"   \x1B[33mat Symbol(k2):\x1B[39m\n",
			"      \x1B[31mA\x1B[39m    \x1B[32mA\x1B[4mB\x1B[24m\x1B[39m \n",
			"   \n",
			"   \x1B[1m\x1B[33mExpected to be Deeply Equal\x1B[39m\x1B[22m\n",
			"   \n",
			"                      \x1B[31m{\x1B[39m                          \x1B[32m{\x1B[39m \n" +
			"   \x1B[31m  [Symbol(k2)]: 'A',\x1B[39m      \x1B[32m  [Symbol(k2)]: 'AB',\x1B[39m \n" +
			"                \x1B[31m  k2: {\x1B[39m                   \x1B[32m  k3: 1,\x1B[39m \n" +
			"            \x1B[31m    k: true\x1B[39m                    \x1B[32m  k4: {\x1B[39m \n" +
			"                   \x1B[31m  },\x1B[39m                 \x1B[32m    kk4: {\x1B[39m \n" +
			"                \x1B[31m  k4: {\x1B[39m           \x1B[32m      kk5: 'yes'\x1B[39m \n" +
			"             \x1B[31m    kk4: {\x1B[39m                      \x1B[32m    }\x1B[39m \n" +
			"        \x1B[31m      kk5: 'no'\x1B[39m                        \x1B[32m  }\x1B[39m \n" +
			"                  \x1B[31m    }\x1B[39m                          \x1B[32m}\x1B[39m \n" +
			"                    \x1B[31m  }\x1B[39m                            \n" +
			"                      \x1B[31m}\x1B[39m                            \n",
		].join("")

		check_is(logs.includes(expectedDeepDiffs), true)

		cleanup()
	})

	test("files with no tests: prints correct info", async () => {

		const fixt = ["./fixture.noTests.js"]
		let logs = await setup(fixt)

		const rec = logs.join("")

		const exp = [
			"   \x1B[34m🧟‍♀️Files with no tests: \x1B[39m\n",
			"      🧟‍♂️\x1B[34mtests/integration/fixture.noTests.js\x1B[39m\n",
			"\n",
			"            Total \n" +
			"   \x1B[2mFiles   \x1B[22m     0 \n" +
			"   \x1B[2mTests   \x1B[22m     0 \n",
			"   \n",
		].join("")

		check_is(rec.includes(exp), true)
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
	check_is(rec, exp)

	rec = toHuman(1_001)
	exp = "1.00s"
	check_is(rec, exp)

	rec = toHuman(1_011)
	exp = "1.01s"
	check_is(rec, exp)

	rec = toHuman(59_999)
	exp = "59.99s"
	check_is(rec, exp)

	rec = toHuman(60_000)
	exp = "1m 0s"
	check_is(rec, exp)

	rec = toHuman(70_000)
	exp = "1m 10s"
	check_is(rec, exp)

	rec = toHuman(3_599_999)
	exp = "59m 59s"
	check_is(rec, exp)

	rec = toHuman(3_600_000)
	exp = "1h 0m 0s"
	check_is(rec, exp)

	rec = toHuman(86_399_999)
	exp = "23h 59m 59s"
	check_is(rec, exp)

	rec = toHuman(86_400_000)
	exp = "days"
	check_is(rec, exp)
})


async function getFilesAndContents(absPaths) {
	return Promise.all(absPaths.map(async path => {
		return {
			path,
			content: await readFile(path, "utf8"),
		}
	}))
}

function checkMultLines(expectedLines, logs, i) {
	const expectedLinesLength = expectedLines.length
	const rec = logs.slice(++i, i += expectedLinesLength)
	const exp = expectedLines
	check_Eq(rec, exp)
	i--
	return i
}
