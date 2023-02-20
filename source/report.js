import { EOL } from "node:os"
import util from "node:util"
import { relative } from "node:path"
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
		"right": "", "right-mid": "", "middle": "│",
	},
	style: {
		["padding-left"]: 0,
		["padding-right"]: 0,
	},
}
const TABLE_PADDING = 1


/*
suite:: {
	duration:: ms,
	suites:: Map ('/home/sophi/tests/file1.test.js' -> {
		clusters: {
			runnable:: 'Test title 2' -> {fn, error?},
			skipped:: 'Test title 3' -> {},
			t0d0s:: 'Test title 3' -> {},
		},
		justUsed: bool,
		testCount: number,
		file_content:: string
	})
}
*/
export function report(suite, {printDiffs = false, projectRoot = globalThis[SOPHI].projectRoot} = {}) {

	const L = " | ".dim
	const { print, indent, outdent } = helpers(globalThis.console, process)
	const summary = summarize(suite.suites)

	print_nl()
	if (summary.passedCountPerFile.size > 0) {
		print_passedCountPerFile(summary.passedCountPerFile)
		print_nl(2)
	}
	if (summary.fails.size > 0) {
		print_FailedTests(summary.fails)
		print_nl()
	}
	print_Summary(summary, suite)

/*

	function warnIfNoTests(suites) {
		for (const [filePath, suite] of suites) {
			if (suite.testCount === 0) {
				console.log()
			}
		}
	}
*/
	function helpers(console, process) {

		const _console = new console.Console({
			stdout: process.stdout,
			groupIndentation: 3,
		})

		const print = _console.log
		const indent = _console.group
		const outdent = _console.groupEnd

		return { print, indent, outdent }
	}

	function summarize(suites) {

		let fails = new Map()   //  relFilePath -> {file_content, tests: testTitle -> {testErr, groups}}
		let passedCountPerFile = new Map()   // filePath -> passedCount
		let countSkippedFiles = 0
		let countTodoFiles = 0

		let countPassedTests = 0
		let countFailedTests = 0
		let countSkippedTests = 0
		let countTodoTests = 0
		let filesWithNoTests = new Set()

		for (const [filePath, suite] of suites) {

			const relFilePath = relative(projectRoot, filePath)

			if (suite.testCount === 0) {
				filesWithNoTests.add(relFilePath)
				continue
			}

			const {runnable, skipped, todos} = suite.clusters

			countSkippedTests += skipped.size
			countTodoTests += todos.size

			if (runnable.size === 0) {
				if (skipped.size > 0) countSkippedFiles++
				else countTodoFiles++
				continue
			}

			let filePassed = true
			let failedTests

			for (const [testID, test] of runnable) {

				if (!test.error) {
					countPassedTests++
					continue
				}

				filePassed = false
				countFailedTests++

				if (!fails.has(relFilePath)) {

					failedTests = new Map()

					const failInfo = {
						file_content: suite.file_content,
						tests: failedTests,
					}

					fails.set(relFilePath, failInfo)
				}

				const {testTitle, groups} = extractTestTitleAndGroups(testID)

				const testInfo = {
					testErr: test.error,
					groups,
				}

				failedTests.set(testTitle, testInfo)
			}

			if (filePassed) {
				passedCountPerFile.set(relFilePath, runnable.size)
			}
		}

		const countPassedFiles = passedCountPerFile.size
		const countFailedFiles = fails.size

		return {
			fails,
			passedCountPerFile,

			countPassedFiles,
			countFailedFiles,
			countSkippedFiles,
			countTodoFiles,

			countPassedTests,
			countFailedTests,
			countSkippedTests,
			countTodoTests,

			filesWithNoTests,
		}
	}

	function print_passedCountPerFile(passedCountPerFile) {
		for (const [path, count] of passedCountPerFile) {
			const TESTS_PASSED = `${count} Test${count > 1 ? "s" : ""}`.green
			print("✓".green.thick + " " + path + L + TESTS_PASSED)
		}
	}

	function print_FailedTests(fails) {

		for (const [file_path, {file_content, tests}] of fails) {
			for (const [testTitle, {testErr, groups}] of tests) {

				const { cleanErrStack, failLoc } = dependencies(testErr, file_path)

				print_PathAndLine(file_path, failLoc)
					print_nl()
				indent()
					print_TestTitle(testTitle, groups)
					print_nl()
					print_AssertionZone(failLoc.line, file_content)
					print_nl()
					print_ErrorDiagnostics(testErr, cleanErrStack)
					print_nl(2)
				outdent()
			}
		}


		function dependencies(testErr, file_path) {
			const cleanStack = trimErrStack(testErr.stack)

			return {
				cleanErrStack: cleanStack,
				failLoc: getFailLocation(cleanStack, file_path),
			}
		}

		function print_PathAndLine(file_path, failLoc) {

			const fileTitle = `${file_path}:${failLoc.line}:${failLoc.col}`

			print(`${" Fail ".red.inverse} ${fileTitle.red.thick} ${"─".repeat(20).red}`)
		}

		function print_TestTitle(title, groups) {
			groups = groups.join(" ▶ ")
			groups = groups === "" ? "" : (groups + " ▶ ")
			print(`${groups}${title}`.yellow.thick)
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

				if (printDiffs) {
					const diff = deepDiff(received, expected)

					const existDiff = !Array.isArray(diff)

					if (existDiff) {
						print_Diffs(diff)
					}
				}

				print_AssertionMsg(message)
				print_nl()
				indent()
					print_ComparatesWhole(received, expected)
				outdent()
				print_nl()
				print_Stack(cleanErrStack)
			}
			else {
				print(testErr)
			}

			function print_Diffs(diff) {

				diff = flatten(diff)

				for (let { path, recLeaf, expLeaf } of diff) {
					print(formatPath(path, "."))
					indent()
						print(toTable(recLeaf, expLeaf).toString())
					outdent()
					print_nl()
				}

				function flatten(diff) {
					let flatDiffs = []
					let currPath = []

					_build(diff)

					function _build(diff) {

						if (Array.isArray(diff)) {

							const rec = diff[0]
							const exp = diff[1]

							flatDiffs.push({
								path: currPath.slice(),
								recLeaf: rec,
								expLeaf: exp,
							})

							return
						}

						const { type, diffs } = diff

						const sortedKs = [...diffs.keys()]
							.sort((a, b) => {
								if (typeof a === "symbol" || typeof b === "symbol") {
									return 0
								}
							})

						for (const k of sortedKs) {
							currPath.push({ k, type })
							_build(diffs.get(k))
							currPath.pop()
						}
					}

					return flatDiffs
				}

				function formatPath(_path, separator) {

					let path = []

					for (let pathSegment of _path) {
						let k = pathSegment.k

						if (typeof k === "symbol") {
							k = k.toString()
						}
						else {   // is string
							k = `'${k}'`
						}

						path.push(k)
					}

					return ("at " + `${separator}` + path.join(separator) + ":").yellow
				}

				function toTable(rec, exp) {

					let table = new Table(TABLE_OPTS)

					const rec_exp_cells = toTableCell(rec, exp)

					table.push(rec_exp_cells)

					return table

					function toTableCell(rec, exp) {

						if (bothCanStringDiff(rec, exp)) {
							[rec, exp] = markStrsDiffs(rec, exp)
							rec = rec.red
							exp = exp.green
						}
						else {
							rec = rec === empty ? "-".white : formatComparate(rec).red
							exp = exp === empty ? "-".white : formatComparate(exp).green
						}

						const recCell = {
							content: rec,
							style: {
								["padding-right"]: TABLE_PADDING,
							},
						}

						const expCell = {
							content: exp,
							style: {
								["padding-left"]: TABLE_PADDING,
							},
						}

						return [recCell, expCell]


						function formatComparate(comp) {

							let str = comp

							if (comp?.constructor === Object) {
								const opts = {
									depth: 2,
									compact: false,
									colors: false,
									sorted: true,
								}
								let objStr = util.inspect(comp, opts)
								str = objStr
							}
							else {
								const opts = {
									depth: 3,
									compact: true,
									colors: false,
									sorted: true,
								}
								str = util.inspect(comp, opts)
							}

							return str
						}
					}
				}
			}

			function print_AssertionMsg(message) {
				print(message.yellow.thick)
			}

			function print_ComparatesWhole(rec, exp) {

				let diffed = false

				if (bothCanStringDiff(rec, exp)) {
					[rec, exp] = markStrsDiffs(rec, exp)
					diffed = true
				}

				let table = new Table(TABLE_OPTS)

				const opts = { depth: 50, compact: false, sorted: true, colors: false }

				rec = diffed ? rec : util.inspect(rec, opts)
				exp = diffed ? exp : util.inspect(exp, opts)

				const recCell = {
					content: rec.red,
					style: {
						["padding-right"]: TABLE_PADDING,
					},
				}

				const expCell = {
					content: exp.green,
					style: {
						["padding-left"]: TABLE_PADDING,
					},
				}

				table.push([recCell, expCell])

				print(table.toString())
			}

			function print_Stack(cleanErrStack) {
				print(cleanErrStack.map(l => l.trim()).join(NL).dim)
			}

			function bothCanStringDiff(rec, exp) {

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

			function markStrsDiffs(rec, exp) {

				const style = "underline"

				rec = rec.toString()
				exp = exp.toString()

				const recL = rec.length
				const expL = exp.length

				let shortStr = rec
				let longStr = exp
				if (recL > expL) {
					[shortStr, longStr] = [exp, rec]
				}

				const shortL = shortStr.length

				let recNew = ""
				let expNew = ""

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

					recNew += rec[i]
					expNew += exp[i]
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

				return [recNew, expNew]
			}
		}

		function getFailLocation(cleanErrStack, file_path) {

			let failLine = cleanErrStack
				.find(x => x.includes(file_path))
				.split(":")
			const line = failLine[failLine.length - 2]
			const col = failLine[failLine.length - 1].replaceAll(")", "")

			return {
				line: Number(line),
				col: Number(col),
			}
		}

		function trimErrStack(stack) {
			return stack.split(NL)
				.map(l => l.trim())
				.filter(l => l.startsWith("at"))
		}
	}

	function print_Summary(summary, suite) {

		let {
			countFailedFiles: fail_F,
			countPassedFiles: pass_F,
			countSkippedFiles: skip_F,
			countTodoFiles: todo_F,

			countFailedTests: fail_T,
			countPassedTests: pass_T,
			countSkippedTests: skip_T,
			countTodoTests: todo_T,

			filesWithNoTests,
		} = summary

		let totalF = pass_F + fail_F + skip_F + todo_F
		let totalT = pass_T + fail_T + skip_T + todo_T

		const FILES = "   Files  ".dim
		fail_F = fail_F ? `${fail_F} Failed`.red + L : ""
		pass_F = pass_F ? `${pass_F} Passed`.green +  L : ""
		skip_F = skip_F ? `${skip_F} Skipped`.yellow + L : ""
		todo_F = todo_F ? `${todo_F} Todo`.blue + L : ""
		totalF = `${totalF} Total`

		const TESTS = "   Tests  ".dim
		fail_T = fail_T ? `${fail_T} Failed`.red + L : ""
		pass_T = pass_T ? `${pass_T} Passed`.green + L : ""
		skip_T = skip_T ? `${skip_T} Skipped`.yellow + L : ""
		todo_T = todo_T ? `${todo_T} Todo`.blue + L : ""
		totalT = `${totalT} Total`

		const separator = "─".repeat(Math.floor(process.stdout.columns * 0.75))

		print(" Summary ".inverse + " " + separator)
		print_nl()
		print_FilesWithNoTests()
		print_todos(suite)
		indent()
			print(FILES + fail_F + pass_F + skip_F + todo_F + totalF)
			print(TESTS + fail_T + pass_T + skip_T + todo_T + totalT)
			print(`${"Duration".dim}  ${toHuman(suite.duration)}`)
		outdent()
		print_nl(2)


		function print_FilesWithNoTests() {
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

		function print_todos(suite) {
			if (summary.countTodoTests === 0) return

			indent()
			print("🖊️ Todo tests: ".blue)
			indent()
			for (const [filePath, {clusters: {todos}}] of suite.suites) {
				if (todos.size === 0) continue
				print(`● ${relative(projectRoot, filePath)}`.blue)
				indent()
				for (const entry of todos) {
					print(`◻ ${entry[0]}`.blue)
				}
				outdent()
			}
			outdent()
			outdent()
			print_nl()
		}
	}

	function print_nl(i = 1) {
		while (i) {
			print("")
			i--
		}
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
