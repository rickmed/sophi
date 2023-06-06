import { describe, test } from "../source/FileSuite.mjs"
import { check_is, check_Eq} from "../source/check.mjs"
import { exec } from "../source/exec.mjs"
import { toRelPathFromProjRoot, findSectionInLog } from "./utils.mjs"
import { toHuman } from "../source/report.mjs"
import { ink } from "../source/ink.mjs"


const NL = "\n"
const SEP = " | ".dim_
const INDENT = " ".repeat(3)

const _toRelPathFromProjRoot = toRelPathFromProjRoot(import.meta.url)


describe("report()", () => {

	test.skip("prints a base test suite correctly", async () => {

		const fixts = {
			passedFiles: [
				"./fixture.pass.mixedAssert.mjs",
				"./fixture.pass.mjs",
			],
			todoFiles: [
				"./fixture.todo.mjs",
			],
			failFiles: [
				"./fixture.fail.mjs",
				"./fixture.fail.nonSophiAssert.mjs",
			],
		}

		const logs = await setup([...fixts.passedFiles, ...fixts.failFiles, ...fixts.todoFiles])

		const failExpectedSpecs = [
			{
				FailPathLoc: "tests/integration/fixture.fail.mj:6:3",
				TestTitle: "group1 ▶ Test title",
				AssertionZone: [
					INDENT + `    5:    test("Test title", () => {`.dim_ + NL,
					INDENT + ("  > ".red + "6:       check_is(23099, 131)").bold + NL,
					INDENT + `    7:    })`.dim_ + NL,
				],
				ErrorDiagnosticsSophi: [
					INDENT + "Expected to be the same (Object.is)".yellow.bold + NL,
					INDENT + NL,
					INDENT + INDENT + `${"2".underline}3${"0".underline}${"99".underline}`.red + `${"1".underline}3${"1".underline}`.green + NL,
				],
			},
			{
				FailPathLoc: "tests/integration/fixture.fail.mj:24:2",
				TestTitle: "Test title 2",
				AssertionZone: [
					INDENT + `    23: `.dim_ + NL,
					INDENT + ("  > ".red + `24:    check_Eq(rec, exp, "user message")`).bold + NL,
					INDENT + `    25: })`.dim_ + NL,
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
				FailPathLoc: "tests/integration/fixture.fail.mj:29:2",
				TestTitle: "Test title 3",
				AssertionZone: [
					INDENT + `    28:    await Promise.resolve(1)`.dim_ + NL,
					INDENT + ("  > ".red + "29:    check_is(230, 13199)").bold + NL,
					INDENT + `    30: })`.dim_ + NL,
				],
				ErrorDiagnosticsSophi: [
					INDENT + "Expected to be the same (Object.is)".yellow.bold + NL,
					INDENT + NL,
					INDENT + INDENT + `${"2".underline}3${"0".underline}`.red + `${"1".underline}3${"1".underline}${"99".underline}`.green + NL,
				],
			},
			{
				FailPathLoc: "tests/integration/fixture.fail.nonSophiAssert.mj:5:9",
				TestTitle: "Example test title",
				AssertionZone: [
					INDENT + `    4: test("Example test title", () => {`.dim_ + NL,
					INDENT + ("  > ".red + "5:    assert.equal(1, 2)").bold + NL,
					INDENT + `    6: })`.dim_ + NL,
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

			let printIncluded = section.includes(toPrint("tests/integration/fixture.pass.mixedAssert.mjs", "2 Tests"))
			check_is(printIncluded, true)

			printIncluded = section.includes(toPrint("tests/integration/fixture.pass.mjs", "1 Test"))
			check_is(printIncluded, true)

			check_is(logs[i], NL)
			check_is(logs[++i], NL)

			function toPrint(path, txt) {
				return "✓".green.bold + " " + path + SEP + txt.green + NL
			}
		}

		function check_FailedTests(logs, specs) {

			let rec; let exp

			for (const spec of specs) {

				let { FailPathLoc, TestTitle, AssertionZone, ErrorDiagnosticsSophi } = spec

				const pathAndLocMsg = `${ink(" Fail ").red.inverse_} ${FailPathLoc.red.bold} ${"─".repeat(20).red}` + NL

				const logsIdx = findSectionInLog(pathAndLocMsg, logs)
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
					exp = INDENT + TestTitle.yellow.bold + NL
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

			const logsIdx = findSectionInLog(ink(" Summary ").inverse_, logs, {startsWith: true})
			let i = logsIdx

			check_3NL_above()
			check_is(logs[++i], NL)

			let rec, exp

			const todoMsgs = [
				"   \x1B[34m🖊️ Todo tests: \x1B[39m\n",
				"      \x1B[34m● tests/integration/fixture.todo.mj\x1B[39m\n",
				"         \x1B[34m◻ Test title\x1B[39m\n",
				"\n",
			]

			i = checkMultLines(todoMsgs, logs, i)

			rec = logs[++i]
			exp = INDENT + "   Files  ".dim_ + `2 Failed`.red + SEP + `2 Passed`.green + SEP + `1 Todo`.blue + SEP + `5 Total` + NL
			check_is(rec, exp)

			rec = logs[++i]
			exp = INDENT + "   Tests  ".dim_ + `4 Failed`.red + SEP + `3 Passed`.green + SEP + `1 Todo`.blue + SEP + `8 Total` + NL
			check_is(rec, exp)

			rec = logs[++i].startsWith(INDENT + "Duration".dim_ + "  ")
			exp = true
			check_is(rec, exp)


			function check_3NL_above() {
				check_is(logs[i - 3].includes(NL), true)
				check_is(logs[i - 2].includes(NL), true)
				check_is(logs[i - 1].includes(NL), true)
			}
		}
	})

	test.skip("files with no tests: prints correct info", async () => {

		const fixt = ["./fixture.noTests.mjs"]
		let logs = await setup(fixt)

		const rec = logs.join("")

		const exp = [
			"   \x1B[34m🧟‍♀️Files with no tests: \x1B[39m\n",
			"      🧟‍♂️\x1B[34mtests/integration/fixture.noTests.mj\x1B[39m\n",
			"\n",
			"            Total \n" +
			"   \x1B[2mFiles   \x1B[22m     0 \n" +
			"   \x1B[2mTests   \x1B[22m     0 \n",
			"   \n",
		].join("")

		check_is(rec.includes(exp), true)
	})


	async function setup(testFilePath_s) {

		testFilePath_s = testFilePath_s.map(_toRelPathFromProjRoot)

		const origStdOutWrite = process.stdout.write
		let logs = []
		process.stdout.write = function myWrite(x) {
			logs.push(x)
		}
		process.stdout._$cols = process.stdout.columns
		process.stdout.columns = 160

		await exec(testFilePath_s)

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


function checkMultLines(expectedLines, logs, i) {
	const expectedLinesLength = expectedLines.length
	const rec = logs.slice(++i, i += expectedLinesLength)
	const exp = expectedLines
	check_Eq(rec, exp)
	i--
	return i
}
