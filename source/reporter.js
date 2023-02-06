import { EOL } from "node:os"
import util from "node:util"
import Table from "cli-table3"
import { deepDiff, empty } from "./deepDiff.js"
import { ERR_SOPHI_CHECK } from "./checker.js"
import { setColorsProto, restoreColorsProto } from "./colors.js"

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
		["padding-right"]: 0
	}
}
const TABLE_PADDING = 1


/*
suite: {
	duration:: time,
	results: [{
		file_path: "source/passedTests2.fixture.js",
		file_contents:: string,
		tests: [{
			title,
			error?,
			fn,
		}]
	}]
}
*/
export function report(suite, {printDiffs = false} = {}) {

	setColorsProto()

	const L = " | ".dim
	const { print, indent, outdent } = helpers()
	const resultsSummary = summarize()

	print_nl()
	print_PassedFilesPath()
	print_nl(2)
	print_FailedTests()
	print_nl()
	print_Summary()

	restoreColorsProto()


	function helpers() {

		const console = new globalThis.console.Console({
			stdout: process.stdout,
			groupIndentation: 3
		})

		const print = console.log
		const indent = console.group
		const outdent = console.groupEnd

		return { print, indent, outdent }
	}

	function summarize() {
		const { results } = suite

		let failedTests = new Map()   // fileIdxInResults -> [testIdx]
		let passedFilesStats = new Map()   // passedFilePath -> countPassedTests
		let countPassedTests = 0
		let countFailedTests = 0

		const resultsL = results.length
		for (let fileSuite_idx = 0; fileSuite_idx < resultsL; fileSuite_idx++) {

			let filePassed = true

			const { tests } = results[fileSuite_idx]
			const testsL = tests.length
			for (let testIdx = 0; testIdx < testsL; testIdx++) {

				const test = tests[testIdx]

				if (test.error) {
					filePassed = false
					countFailedTests++

					const fileFailedTests = failedTests.get(fileSuite_idx)
					if (!fileFailedTests) {
						failedTests.set(fileSuite_idx, [])
					}

					failedTests.get(fileSuite_idx).push(testIdx)
				}
				else {
					countPassedTests++
				}
			}

			if (filePassed) {
				passedFilesStats.set(results[fileSuite_idx].file_path, testsL)
			}
		}

		const countPassedFiles = passedFilesStats.size
		const countFailedFiles = results.length - countPassedFiles

		return {
			failedTests,
			passedFilesStats,
			countPassedTests,
			countFailedTests,
			countPassedFiles,
			countFailedFiles
		}
	}

	function print_PassedFilesPath() {
		for (const [path, count] of resultsSummary.passedFilesStats) {
			const TESTS_PASSED = `${count} Test${count > 1 ? "s" : ""}`.green
			print("✓".green.thick + " " + path + L + TESTS_PASSED)
		}
	}

	function print_FailedTests() {

		for (const [fileIdx, testIdxs] of resultsSummary.failedTests) {

			const fileSuite = suite.results[fileIdx]
			const { file_path, file_contents } = fileSuite

			for (const idx of testIdxs) {

				const { testTitle, testErr, cleanErrStack, failLoc } = dependencies(fileSuite.tests[idx], file_path)

				print_PathAndLine(file_path, failLoc)
					print_nl()
				indent()
					print_TestTitle(testTitle)
					print_nl()
					print_AssertionZone(failLoc.line, file_contents)
					print_nl()
					print_ErrorDiagnostics(testErr, cleanErrStack)
					print_nl(2)
				outdent()
			}
		}


		function dependencies(test, file_path) {
			const { error, title } = test
			const cleanStack = trimErrStack(error.stack)

			return {
				testTitle: title,
				testErr: error,
				cleanErrStack: cleanStack,
				failLoc: getFailLocation(cleanStack, file_path)
			}
		}

		function print_PathAndLine(file_path, failLoc) {

			const fileTitle = `${file_path}:${failLoc.line}:${failLoc.col}`

			print(`${" Fail ".red.inverse} ${fileTitle.red.thick} ${"─".repeat(20).red}`)
		}

		function print_TestTitle(title) {
			print(`${title}`.yellow.thick)
		}

		function print_AssertionZone(failLine, file_contents, printNLines = 3) {
			const fileLines = file_contents.split(EOL)
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
								["padding-right"]: TABLE_PADDING
							},
						}

						const expCell = {
							content: exp,
							style: {
								["padding-left"]: TABLE_PADDING
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
									sorted: true
								}
								let objStr = util.inspect(comp, opts)
								str = objStr
							}
							else {
								const opts = {
									depth: 3,
									compact: true,
									colors: false,
									sorted: true
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
						["padding-right"]: TABLE_PADDING
					},
				}

				const expCell = {
					content: exp.green,
					style: {
						["padding-left"]: TABLE_PADDING
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
				.filter(x => x.includes(file_path))[0]
				.split(":")
			const line = failLine[failLine.length - 2]
			const col = failLine[failLine.length - 1]
				.slice(0, -1)  // remove final ")"

			return {
				line: Number(line),
				col: Number(col)
			}
		}

		function trimErrStack(stack) {
			return stack.split(NL)
				.map(l => l.trim())
				.filter(l => l.startsWith("at"))
		}
	}

	function print_Summary() {

		const {
			countPassedFiles: pF,
			countFailedFiles: fF,
			countPassedTests: pT,
			countFailedTests: fT
		} = resultsSummary

		const tF = pF + fF
		const tT = pT + fT

		const FILES = "   Files  ".dim
		const FF = `${fF} Failed`.red
		const PF = `${pF} Passed`.green
		const TF = `${tF} Total`

		const TESTS = "   Tests  ".dim
		const FT = `${fT} Failed`.red
		const PT = `${pT} Passed`.green
		const TT = `${tT} Total`

		const separator = "─".repeat(Math.floor(process.stdout.columns * 0.75))

		print(" Summary ".inverse + " " + separator)
		print_nl()
		indent()
			print(FILES + FF + L + PF + L + TF)
			print(TESTS + FT + L + PT + L + TT)
			print(`${"Duration".dim}  ${toHuman(suite.duration)}`)
		outdent()
		print_nl(2)
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
