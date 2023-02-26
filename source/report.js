import { Console } from "node:console"
import util from "node:util"
import { relative } from "node:path"
import { EOL } from "node:os"
import Table from "cli-table3"
import { deepDiff, empty } from "./deepDiff.js"
import { ERR_SOPHI_CHECK } from "./check.js"
import { extractTestTitleAndGroups } from "./suite.js"
import { SOPHI } from "./utils.js"
import "./colors/colors.js"

const NL = "\n"
const TABLE_OPTS = {
	chars: {
		"top": "", "top-mid": "", "top-left": "", "top-right": "",
		"bottom": "", "bottom-mid": "", "bottom-left": "", "bottom-right": "",
		"left": "", "left-mid": "", "mid": "", "mid-mid": "",
		"right": "", "right-mid": "", "middle": "",
	},
	style: {},
}

const { print, indent, outdent } = helpers()

/*
suite:: {
	suites:: Map ('/projecRoot/tests/testFile.test.js' -> {
		clusters: {
			runnable:: 'Test title 2' -> {fn, error?},
			skip:: 'Test title 3' -> {},
			t0d0:: 'Test title 3' -> {},
		},
		n_Tests: number,
		file_content:: string
	})
	oneOrJustUsed: false | "one" | "just",
	duration:: {
		collect: ms,
		tests: ms,
	}
}
*/
export function report(suite, {
	projectRoot = globalThis[SOPHI].projectRoot,
	markStringables = true,
} = {}) {

	const startTime = Date.now()
	const summary = summarize(suite.suites)
	const { failTests } = summary

	print_nl()
	print_SummaryPerFile(failTests, suite.suites)
	print_FailedTests(failTests, suite.suites)
	print_Summary(summary, suite)

	function summarize(suites) {

		let filesWithNoTests = new Set()
		let failTests = new Map()   //  filePath -> Set(testID)
		let n_SkippedFiles = 0
		let n_TodoFiles = 0

		let n_PassedTests = 0
		let n_FailedTests = 0
		let n_SkippedTests = 0
		let n_TodoTests = 0

		for (const [filePath, fileSuite] of suites) {
			const { clusters, n_Tests } = fileSuite

			if (fileSuite.n_Tests === 0) {
				filesWithNoTests.add(filePath)
				continue
			}

			const { runnable, skip, todo } = clusters

			n_SkippedTests += skip.size
			n_TodoTests += todo.size

			if (skip.size === n_Tests) {
				n_SkippedFiles++
				continue
			}

			if (todo.size === n_Tests) {
				n_TodoFiles++
				continue
			}

			let fileFailesTests

			for (const [testID, test] of runnable) {

				if (!test.error) {
					n_PassedTests++
					continue
				}

				n_FailedTests++

				if (!failTests.has(filePath)) {
					fileFailesTests = new Set()
					failTests.set(filePath, fileFailesTests)
				}

				fileFailesTests.add(testID)
			}
		}

		return {
			failTests,

			n_PassedFiles: suites.size - failTests.size - n_SkippedFiles - n_TodoFiles,
			n_FailedFiles: failTests.size,
			n_SkippedFiles,
			n_TodoFiles,

			n_PassedTests,
			n_FailedTests,
			n_SkippedTests,
			n_TodoTests,

			filesWithNoTests,
		}
	}

	function print_SummaryPerFile(failTests, suites) {

		let tableOpts = copy(TABLE_OPTS)
		tableOpts.style["padding-right"] = 0
		tableOpts.style["padding-left"] = 0
		let table = new Table(tableOpts)

		for (const [filePath, { clusters: { runnable, skip, todo } }] of suites) {

			const fileFailTests = failTests.get(filePath)
			const n_FailT = fileFailTests?.size || 0

			let tableRow = []

			const starter = n_FailT === 0 ? "● ".green : "● ".red
			tableRow.push({ content: starter + filePath, style: { ["padding-right"]: 1 } })

			const n_PassT = runnable.size - n_FailT
			const n_SkipT = skip.size
			const n_TodoT = todo.size

			tableRow.push(toCell(n_FailT ? `${n_FailT} ✘`.red : ""))
			tableRow.push(toCell(n_PassT ? `${n_PassT} ✔`.green : ""))
			tableRow.push(toCell(n_SkipT ? `${n_SkipT} ${"❯❯".thick}`.yellow : ""))
			tableRow.push(toCell(n_TodoT ? `${n_TodoT} []`.blue : ""))

			table.push(tableRow)


			function toCell(str) {
				return {
					content: str,
					hAlign: "right",
					style: {
						["padding-right"]: str === "" ? 0 : 2,
						["padding-left"]: 0,
					},
				}
			}
		}

		print(table.toString())
		print_nl(2)
	}

	function print_FailedTests(failTests, suites) {
		if (failTests.size === 0) return

		for (let [filePath, testID_s] of failTests) {
			const { file_content, clusters: { runnable } } = suites.get(filePath)

			for (const testID of testID_s) {
				const { error: testErr } = runnable.get(testID)

				const { cleanErrStack, failLoc } = dependencies(testErr, filePath)

				print_PathAndLine(filePath, failLoc)
				print_nl()
				indent()
				print_TestTitle(testID)
				print_nl()
				print_AssertionZone(failLoc.line, file_content)
				print_nl()
				print_ErrorDiagnostics(testErr, cleanErrStack)
				print_nl(2)
				outdent()
			}
		}

		print_nl()


		function dependencies(testErr, filePath) {
			const cleanStack = trimErrStack(testErr.stack)

			return {
				cleanErrStack: cleanStack,
				failLoc: getFailLocation(cleanStack, filePath),
			}


			function trimErrStack(stack) {
				return stack.split(NL)
					.map(l => l.trim())
					.filter(l => l.startsWith("at"))
			}

			function getFailLocation(cleanErrStack, filePath) {

				let failLine = cleanErrStack
					.find(x => x.includes(filePath))

				if (!failLine) {
					throw new Error("An error occurred outside test files: ", { cause: testErr })
				}

				failLine = failLine.split(":")
				const line = failLine[failLine.length - 2]
				const col = failLine[failLine.length - 1].replaceAll(")", "")

				return {
					line: Number(line),
					col: Number(col),
				}
			}
		}

		function print_PathAndLine(filePath, failLoc) {

			const fileTitle = `${filePath}:${failLoc.line}:${failLoc.col}`

			print(`${" Fail ".red.inverse} ${fileTitle.red.thick} ${"─".repeat(20).red}`)
		}

		function print_TestTitle(testID) {
			let { testTitle, groups } = extractTestTitleAndGroups(testID)
			groups = groups.join(" ▶ ")
			groups = groups === "" ? "" : (groups + " ▶ ")
			print(`${groups}${testTitle}`.yellow.thick)
		}

		function print_AssertionZone(failLine, file_content, printNLines = 3) {
			const fileLines = file_content.split(EOL)
			const lowestLineIdx = failLine - Math.floor(printNLines / 2)
			const highestLineIdx = lowestLineIdx + printNLines - 1
			const padd = " ".repeat(4)
			const indent = " ".repeat(3)
			for (let i = lowestLineIdx; i <= highestLineIdx; i++) {
				const codeLine = fileLines[i - 1].replaceAll("\t", indent)
				if (i === failLine) {
					print(("  > ".red + i + ": " + codeLine).thick)
					continue
				}
				print((padd + i + ": " + codeLine).dim)
			}
		}

		function print_ErrorDiagnostics(testErr, cleanErrStack) {

			if (testErr.code === ERR_SOPHI_CHECK) {
				const { received, expected, message } = testErr

				print_Diff(received, expected, markStringables)
				print_nl()
				print_AssertionMsg(message)
				print_nl()
				print_Stack(cleanErrStack)
			}
			else {
				print(testErr)
			}


			function print_Diff(exp, rec) {

				let diff = deepDiff(exp, rec)
				if (isLeaf(diff)) {
					printLeaf(diff)
					return
				}
				print(diffTypeToStr(diff.type))
				printDiff(diff)
				print(diffTypeToCloseBracket(diff.type))


				function printDiff(diff) {

					if (isLeaf(diff)) {
						indent()
						printLeaf(diff)
						outdent()
						return
					}

					indent()

					for (const [k, v] of diff.diffs) {

						const kStr = kAsString(k, diff.type, v.type)

						print(kStr)
						printDiff(v)
						if (!isLeaf(v)) {
							print(diffTypeToCloseBracket(diff.type))
						}
					}

					outdent()
				}

				function printLeaf(diff) {
					let exp = diff[0]
					let rec = diff[1]

					let marked = false

					if (bothCanStringDiff(exp, rec)) {
						[exp, rec] = markStrsDiffs(exp, rec)
						marked = true
					}

					print(leafValToStr(exp, { isExp: true }))
					print(leafValToStr(rec, { isExp: false }))


					function leafValToStr(val, { isExp }) {

						let mark = " ".inverse
						mark = isExp ? mark.green : mark.red

						const opts = {
							depth: 1,
							compact: false,
							colors: true,
							sorted: true,
						}

						if (!marked) {
							val = val === empty ? "" : util.inspect(val, opts)
						}

						val = val.split("\n").map(l => mark + " " + l).join("\n")

						return val
					}

					function bothCanStringDiff(exp, rec) {

						if (exp === empty || rec === empty) return false

						const recType = typeof rec
						const expType = typeof exp

						if (recType !== expType) {
							return false
						}

						const type = recType
						if (type === "string" || type === "number" || type === "bigint" || type === "symbol") {
							return true
						}

						return false
					}

					function markStrsDiffs(exp, rec) {

						const style = "underline"

						exp = exp.toString()
						rec = rec.toString()

						const expL = exp.length
						const recL = rec.length

						let shortStr = rec
						let longStr = exp
						if (recL > expL) {
							[shortStr, longStr] = [exp, rec]
						}

						const shortL = shortStr.length

						let expNew = ""
						let recNew = ""

						let i = 0
						while (i < shortL) {

							if (rec[i] !== exp[i]) {
								let recMarked = ""
								let expMarked = ""

								while (rec[i] !== exp[i] && i < shortL) {
									recMarked += rec[i]
									expMarked += exp[i]
									i++
								}
								recNew += (recMarked[style])
								expNew += (expMarked[style])
								continue
							}

							expNew += exp[i]
							recNew += rec[i]
							i++
						}

						const longL = longStr.length
						let markedRestOfLongStr = ""
						while (i < longL) {
							markedRestOfLongStr += longStr[i]
							i++
						}

						markedRestOfLongStr = markedRestOfLongStr[style]

						if (longStr === rec) {
							recNew += markedRestOfLongStr
						}
						else {
							expNew += markedRestOfLongStr
						}

						return [expNew, recNew]
					}
				}


				function diffTypeToStr(diffType) {

					let k = ""

					if (diffType === "Object") {
						k += "{"
					}
					if (diffType === "Array") {
						k += "["
					}
					if (diffType === "Map") {
						k += "Map {"
					}

					return k
				}

				function diffTypeToCloseBracket(diffType) {
					return diffType === "Array" ? "]" : "}"
				}

				function kAsString(k, parentType, diffType) {

					const opts = {
						depth: 1,
						compact: true,
						colors: false,
						sorted: true,
					}

					k = util.inspect(k, opts) + ": "

					if (parentType === "Map") {
						k += "=> "
					}

					k = k + diffTypeToStr(diffType)

					return k
				}

				function isLeaf(v) {
					return Array.isArray(v)
				}
			}

			function print_AssertionMsg(message) {
				print(message.yellow.thick)
			}

			function print_Stack(cleanErrStack) {
				print(cleanErrStack.map(l => l.trim()).join(NL).dim)
			}
		}
	}

	function print_Summary(summary, suite) {

		let tableOpts = copy(TABLE_OPTS)
		tableOpts.colWidths = [13]
		tableOpts.style = {
			["padding-left"]: 1,
			["padding-right"]: 1,
		}

		const line = " " + "─".repeat(Math.floor(process.stdout.columns * 0.75))
		print(" Summary ".inverse + line)
		print_nl()
		print_oneOrJustUsed()
		print_filesWithNoTests()
		print_todoFiles()
		print_testsAndFilesSummary()
		print_nl()
		print_duration()
		print_nl(2)


		function print_oneOrJustUsed() {

			if (suite.oneOrJustUsed === "one") {
				let filePath
				for (const entry of suite.suites) {
					filePath = entry[0]
				}
				filePath = relative(projectRoot, filePath)
				indent()
				print(`⚠️ ${"one".italic.thick} modifier used in ${filePath.thick}`.yellow)
				outdent()
				print_nl()
			}

			if (suite.oneOrJustUsed === "just") {
				indent()
				print(`⚠️ ${"just".italic.thick} modifier used in: `.yellow)
				indent()
				for (let [filePath] of suite.suites) {
					filePath = relative(projectRoot, filePath)
					print(`⚠️ ${filePath}`.yellow)
				}
				outdent()
				outdent()
				print_nl()
			}
		}

		function print_filesWithNoTests() {
			const { filesWithNoTests } = summary

			if (filesWithNoTests.size > 0) {
				indent()
				print("🧟‍♀️Files with no tests: ".blue)
				indent()
				for (const filePath of filesWithNoTests) {
					print("🧟‍♂️" + filePath.blue)
				}
				outdent()
				outdent()
				print_nl()
			}
		}

		function print_todoFiles() {
			if (summary.n_TodoTests === 0) return

			indent()
			print("🖊️ Todo tests: ".blue)
			indent()
			for (const [filePath, { clusters: { todo } }] of suite.suites) {
				if (todo.size === 0) continue
				print(`● ${relative(projectRoot, filePath)}`.blue)
				indent()
				for (const entry of todo) {
					print(`[] ${entry[0]}`.blue)
				}
				outdent()
			}
			outdent()
			outdent()
			print_nl()
		}

		function print_testsAndFilesSummary() {

			let {
				n_FailedFiles: fail_F, n_PassedFiles: pass_F, n_SkippedFiles: skip_F, n_TodoFiles: todo_F,
				n_FailedTests: fail_T, n_PassedTests: pass_T, n_SkippedTests: skip_T, n_TodoTests: todo_T,
			} = summary

			let _TABLE_OPTS = copy(tableOpts)
			_TABLE_OPTS.colAligns = Array(6).fill("right")

			let table = new Table(_TABLE_OPTS)

			let headers = [""]
			let filesRow = ["Files ".dim]
			let testsRow = ["Tests ".dim]

			const total_F = pass_F + fail_F + skip_F + todo_F
			const total_T = pass_T + fail_T + skip_T + todo_T

			headers.push("Total")
			filesRow.push(total_F)
			testsRow.push(total_T)
			if (fail_T) {
				headers.push("Failed".red)
				filesRow.push(`${fail_F}`.red)
				testsRow.push(`${fail_T}`.red)
			}
			if (pass_T) {
				headers.push("Passed".green)
				filesRow.push(`${pass_F}`.green)
				testsRow.push(`${pass_T}`.green)
			}
			if (skip_T) {
				headers.push("Skipped".yellow)
				filesRow.push(`${skip_F}`.yellow)
				testsRow.push(`${skip_T}`.yellow)
			}
			if (todo_T) {
				headers.push("Todo".blue)
				filesRow.push(`${todo_F}`.blue)
				testsRow.push(`${todo_T}`.blue)
			}

			table.push(headers, filesRow, testsRow)
			print(table.toString())
		}

		function print_duration() {

			let { duration: { collect: collectDuration, tests: testsDuration } } = suite
			let reportDuration = Date.now() - startTime
			let totalDuration = reportDuration + collectDuration + testsDuration
			collectDuration = toHuman(collectDuration)
			testsDuration = toHuman(testsDuration)
			reportDuration = toHuman(reportDuration)
			totalDuration = toHuman(totalDuration)

			let _TABLE_OPTS = copy(tableOpts)
			_TABLE_OPTS.colAligns = Array(5).fill("right")

			let table = new Table(_TABLE_OPTS)

			let headers = ["", "Total", "Collect".dim, "Tests".dim, "Report".dim]
			let times = [{ content: "Duration ".dim, hAlign: "right" }, totalDuration, collectDuration.dim, testsDuration.dim, reportDuration.dim]

			table.push(headers, times)
			print(table.toString())
		}
	}
}

function copy(obj) {
	return JSON.parse(JSON.stringify(obj))
}

function helpers() {

	const _console = new Console({
		stdout: process.stdout,
		groupIndentation: 3,
	})

	const print = _console.log
	const indent = _console.group
	const outdent = _console.groupEnd

	return { print, indent, outdent }
}

function print_nl(i = 1) {
	while (i) {
		print("")
		i--
	}
}



export function toHuman(ms) {

	if (ms < 1_000) {
		return ms + "ms"
	}

	const oneSecond = 1_000
	const oneMinute = 60_000

	if (ms >= oneSecond && ms < oneMinute) {
		const seconds = Math.floor(ms / oneSecond)
		const decimal = (ms / oneSecond).toString().slice(-3, -1)
		return `${seconds}.${decimal}s`
	}

	const oneHour = 3_600_000

	if (ms >= oneMinute && ms < oneHour) {
		const minutes = Math.floor(ms / oneMinute)
		const seconds = Math.floor((ms % oneMinute) / oneSecond)
		return `${minutes}m ${seconds}s`
	}

	const oneDay = 86_400_000

	if (ms >= oneHour && ms < oneDay) {
		const hours = Math.floor(ms / oneHour)
		const minutes = Math.floor((ms % oneHour) / oneMinute)
		const seconds = Math.floor((ms % oneMinute) / oneSecond)
		return `${hours}h ${minutes}m ${seconds}s`
	}

	return "days"
}
