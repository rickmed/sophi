import { Console } from "node:console"
import Table from "cli-table3"
import "./colors/colors.js"

const TABLE_OPTS = {
	chars: {
		"top": "", "top-mid": "", "top-left": "", "top-right": "",
		"bottom": "", "bottom-mid": "", "bottom-left": "", "bottom-right": "",
		"left": "", "left-mid": "", "mid": "", "mid-mid": "",
		"right": "", "right-mid": "", "middle": "",
	},
	style: {},
}

const { print, indent, outdent } = printHelpers()

export function report(suite) {

	const startTime = Date.now()

	print_nl()
	print_SummaryPerFile(suite.fileSuites)
	print_FailedTests(suite.fileSuites)
	print_Summary(suite)

	function print_SummaryPerFile(fileSuites) {

		let tableOpts = copy(TABLE_OPTS)
		tableOpts.style["padding-right"] = 0
		tableOpts.style["padding-left"] = 0
		let table = new Table(tableOpts)

		for (const [filePath, {n_Tests, n_FailT, n_PassT, n_SkipT, n_TodoT}] of fileSuites) {

			let tableRow = []

			let fileMark = "✔ ".green

			if (n_FailT > 0) {
				fileMark = "✘ ".red
			}
			if (n_SkipT === n_Tests) {
				fileMark = "❯❯ ".yellow
			}
			if (n_TodoT === n_Tests) {
				fileMark = "[] ".blue
			}

			tableRow.push({ content: fileMark + filePath, style: { ["padding-right"]: 2 } })
			tableRow.push(toCell(n_FailT ? `${n_FailT} ✘`.red : ""))
			tableRow.push(toCell(n_PassT ? `${n_PassT} ✔`.green : ""))
			tableRow.push(toCell(n_SkipT ? `${n_SkipT} ${"❯".thick}`.yellow : ""))
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

	function print_FailedTests(fileSuites) {
		for (const [filePath, fileSuite] of fileSuites) {
			for (const {failLoc: {line, col}, failMsg} of fileSuite.failedTests) {
				print(`${" Fail ".red.inverse} ${`${filePath}:${line}:${col}`.red.thick} ${"─".repeat(50).red}`)
				print_nl()
				indent()
				print(failMsg)
				outdent()
				print_nl(2)
			}
		}
	}

	function print_Summary(suite) {

		const summary = summarize(suite.fileSuites)

		let tableOpts = copy(TABLE_OPTS)
		tableOpts.colWidths = [13]
		tableOpts.style = {
			["padding-left"]: 1,
			["padding-right"]: 1,
		}

		const line = " " + "─".repeat(Math.floor(process.stdout.columns * 0.75))
		print(" Summary ".inverse + line)
		print_nl()
		print_onlyUsed()
		print_FilesWithNoTests()
		print_TestsAndFilesSummary()
		print_nl()
		print_Duration()
		print_nl(2)


		function summarize(fileSuites) {

			let filesWithNoTests = new Set()
			let n_FailedFiles = 0
			let n_PassedFiles = 0
			let n_SkippedFiles = 0
			let n_TodoFiles = 0

			let n_FailedTests = 0
			let n_PassedTests = 0
			let n_SkippedTests = 0
			let n_TodoTests = 0

			for (const [filePath, fileSuite] of fileSuites) {
				const {n_Tests, n_FailT, n_PassT, n_SkipT, n_TodoT} = fileSuite

				if (n_Tests === 0) {
					filesWithNoTests.add(filePath)
					continue
				}

				n_FailedTests += n_FailT
				n_PassedTests += n_PassT
				n_SkippedTests += n_SkipT
				n_TodoTests += n_TodoT

				if (n_FailT === 0) {
					n_PassedFiles++
				}
				else {
					n_FailedFiles++
				}

				if (n_SkipT === n_Tests) {
					n_SkippedFiles++
					continue
				}

				if (n_TodoT === n_Tests) {
					n_TodoFiles++
					continue
				}
			}

			return {
				n_PassedFiles, n_FailedFiles, n_SkippedFiles, n_TodoFiles,
				n_FailedTests, n_PassedTests, n_SkippedTests, n_TodoTests,
				filesWithNoTests,
			}
		}

		function print_onlyUsed() {

			if (suite.onlyUsed) {
				let filePath
				for (const entry of suite.fileSuites) {
					filePath = entry[0]
				}
				indent()
				print(`⚠️ ${"only".italic.thick} modifier used in ${filePath.thick}`.yellow)
				outdent()
				print_nl()
			}
		}

		function print_FilesWithNoTests() {
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

		function print_TestsAndFilesSummary() {

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

		function print_Duration() {

			let { durations: { collect: collectDuration, test: testsDuration } } = suite

			let reportDuration = Date.now() - startTime
			let totalDuration = reportDuration + collectDuration + testsDuration

			collectDuration = toHuman(collectDuration)
			testsDuration = toHuman(testsDuration)
			reportDuration = toHuman(reportDuration)
			totalDuration = toHuman(totalDuration)

			let _TABLE_OPTS = copy(tableOpts)
			_TABLE_OPTS.colAligns = Array(5).fill("right")

			let table = new Table(_TABLE_OPTS)

			let headers = ["", "Total", "Collect".dim, "Test".dim, "Report".dim]
			let times = [{ content: "Duration ".dim, hAlign: "right" }, totalDuration, collectDuration.dim, testsDuration.dim, reportDuration.dim]

			table.push(headers, times)
			print(table.toString())
		}
	}
}

function copy(obj) {
	return JSON.parse(JSON.stringify(obj))
}

function printHelpers() {

	const _console = new Console({
		stdout: process.stdout,
		groupIndentation: 2,
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
