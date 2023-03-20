import { Console } from "node:console"
import Table from "cli-table3"
import { ink } from "./ink.mjs"


const TABLE_OPTS = {
	chars: {
		"top": "", "top-mid": "", "top-left": "", "top-right": "",
		"bottom": "", "bottom-mid": "", "bottom-left": "", "bottom-right": "",
		"left": "", "left-mid": "", "mid": "", "mid-mid": "",
		"right": "", "right-mid": "", "middle": "",
	},
	style: {},
}


export function report(suite, {stdout = false} = {}) {

	const { print, print_nl, indent, outdent } = printHelpers(stdout)

	const startTime = Date.now()

	print_nl()
	print_SummaryPerFile(suite.fileSuites)
	print_FailedTests(suite.fileSuites)
	print_Summary(suite)

	function print_SummaryPerFile(fileSuites) {
		const tableStr = fileSummaryTable(fileSuites)
		print(tableStr)
		print_nl(2)
	}

	function print_FailedTests(fileSuites) {
		for (const [, fileSuite] of fileSuites) {
			for (const {failMsg} of fileSuite.failedTests) {
				print(failMsg)
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
		print(ink(" Summary ").inverse_ + line)
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
				print(ink(`⚠️ ${ink("only").italic.bold_} modifier used in ${ink(filePath).bold_}`).yellow_)
				outdent()
				print_nl()
			}
		}

		function print_FilesWithNoTests() {
			const { filesWithNoTests } = summary

			if (filesWithNoTests.size > 0) {
				indent()
				print(ink("🧟‍♀️Files with no tests: ").blue_)
				indent()
				for (const filePath of filesWithNoTests) {
					print("🧟‍♂️" + ink(filePath).blue_)
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
			let filesRow = [ink("Files ").dim_]
			let testsRow = [ink("Tests ").dim_]

			const total_F = pass_F + fail_F + skip_F + todo_F
			const total_T = pass_T + fail_T + skip_T + todo_T

			headers.push("Total")
			filesRow.push(total_F)
			testsRow.push(total_T)
			if (fail_T) {
				headers.push(ink("Failed").red_)
				filesRow.push(ink(`${fail_F}`).red_)
				testsRow.push(ink(`${fail_T}`).red_)
			}
			if (pass_T) {
				headers.push(ink("Passed").green_)
				filesRow.push(ink(`${pass_F}`).green_)
				testsRow.push(ink(`${pass_T}`).green_)
			}
			if (skip_T) {
				headers.push(ink("Skipped").yellow_)
				filesRow.push(ink(`${skip_F}`).yellow_)
				testsRow.push(ink(`${skip_T}`).yellow_)
			}
			if (todo_T) {
				headers.push(ink("Todo").blue_)
				filesRow.push(ink(`${todo_F}`).blue_)
				testsRow.push(ink(`${todo_T}`).blue_)
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

			let headers = ["", "Total", ink("Collect").dim_, ink("Test").dim_, ink("Report").dim_]
			let times = [{ content: ink("Duration ").dim_, hAlign: "right" }, totalDuration, ink(collectDuration).dim_, ink(testsDuration).dim_, ink(reportDuration).dim_]

			table.push(headers, times)
			print(table.toString())
		}
	}

	function printHelpers(stdout) {

		const _console = new Console({
			stdout: stdout || process.stdout,
			groupIndentation: 2,
		})

		const print = _console.log
		const indent = _console.group
		const outdent = _console.groupEnd

		function print_nl(i = 1) {
			while (i) {
				print("")
				i--
			}
		}

		return { print, indent, outdent, print_nl }
	}
}

export function fileSummaryTable(fileSuites) {

	let tableOpts = copy(TABLE_OPTS)
	tableOpts.style["padding-right"] = 0
	tableOpts.style["padding-left"] = 0
	let table = new Table(tableOpts)

	for (const [filePath, {n_Tests, n_FailT, n_PassT, n_SkipT, n_TodoT}] of fileSuites) {

		let tableRow = []

		let fileMark = ink("✔ ").green_

		if (n_FailT > 0) {
			fileMark = ink("✘ ").red_
		}
		if (n_SkipT === n_Tests) {
			fileMark = ink("❯❯ ").yellow_
		}
		if (n_TodoT === n_Tests) {
			fileMark = ink("[] ").blue_
		}

		tableRow.push({ content: fileMark + filePath, style: { ["padding-right"]: 2 } })
		tableRow.push(toCell(n_FailT ? ink(`${n_FailT} ✘`).red_ : ""))
		tableRow.push(toCell(n_PassT ? ink(`${n_PassT} ✔`).green_ : ""))
		tableRow.push(toCell(n_SkipT ? ink(`${n_SkipT} ${"❯"}`).yellow_ : ""))
		tableRow.push(toCell(n_TodoT ? ink(`${n_TodoT} []`).blue_ : ""))

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

	return table.toString()
}

function copy(obj) {
	return JSON.parse(JSON.stringify(obj))
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
