import { CHECK_FAIL as SOPHI_CHECK_FAIL } from "./checker.js"
import { EOL } from "node:os"
import { setColorsProto, restoreColorsProto } from "./colors.js"

/*
suite:  [{
	filePath: "source/passedTests2.fixture.js",
	fileContents:: string,
	tests: {
		title,
		status: TEST_PASSED | TEST_FAILED,
		fn,
		error?
	}
}]
*/
export function report(suite) {
	setColorsProto()

	const { Console } = globalThis.console
	const console = new Console({
		stdout: process.stdout,
		groupIndentation: 3
	})
	const print = console.log
	function consoleDir(x) {
		console.dir(x, {depth: null, compact: false, sorted: true})
	}

	for (const fileSuite of suite) {
		let filePassed = true
		const { filePath, fileContents } = fileSuite

		for (const test of fileSuite.tests) {
			const testErr = test.error
			if (testErr) {
				filePassed = false

				const nl = "\n"
				const noMsgErrStack = testErr.stack.split(nl); noMsgErrStack.shift()
				const failLoc = getFailLocation(noMsgErrStack, filePath)

				print_failTitle(filePath, failLoc)

				console.group()

				print_testTitle(test.title)
				print_failLocation(failLoc.line, fileContents)

				if (testErr?.code === SOPHI_CHECK_FAIL) {
					const { received, expected, message } = testErr

					// TODO: if message is usergenerated print in yellow
					print(`${message.yellow}`)

					print("received:".green.thick)
					console.group()
					consoleDir(received)
					console.groupEnd()

					print("expected:".red.thick)
					console.group()
					consoleDir(expected)
					console.groupEnd()
					print_nl()

					print(noMsgErrStack.map(l => l.trim()).join(nl).dim)
				}
				else {
					consoleDir(testErr)
				}

				console.groupEnd()
				print_nl()
			}
		}
		if (filePassed) {
			const numTestsPassed = `(${fileSuite.tests.length.toString()})`
			print(`${"√".green.thick} ${filePath} ${numTestsPassed.dim}`)
		}
	}

	function print_nl() {
		print("")
	}

	function getFailLocation(errStack, filePath) {
		let failLine = errStack.filter(x => x.includes(filePath))[0].split(":")
		const line = failLine[failLine.length  - 2]
		const col = failLine[failLine.length  - 1]
			.slice(0, -1)  // remove final ")"

		return {
			line: Number(line),
			col: Number(col)
		}
	}

	function print_failTitle(filePath, failLoc) {
		print_nl()

		const { line, col } = failLoc
		const fileTitle = `${filePath}:${line}:${col}`
		const FAIL = " FAIL "
		const dividerLength = process.stdout.columns ?
		// 1's are whitespace
			process.stdout.columns - (FAIL.length + 1 + fileTitle.length + 1)
			: 10

		const divider = `${"─".repeat(dividerLength).red}`

		print(`${FAIL.red.inverse} ${fileTitle.red.thick} ${divider}`)

		print_nl()
	}

	function print_testTitle(title) {
		print(`"${title}"`.yellow.thick)
		print_nl()
	}

	function print_failLocation(failLine, fileContents, printNLines = 3) {
		const fileLines = fileContents.split(EOL)
		const lowestLineIdx = failLine - Math.floor(printNLines / 2)
		const highestLineIdx = lowestLineIdx + printNLines - 1
		const padd = " ".repeat(4)
		const tabSpaces = " ".repeat(3)
		for (let i = lowestLineIdx; i <= highestLineIdx; i++) {
			const codeLine = fileLines[i - 1].replaceAll("\t", tabSpaces)
			if (i === failLine) {
				print(("  > ".red + i + ": " + codeLine).thick)
				continue
			}
			print((padd + i + ": " + codeLine).dim)
		}

		print_nl()
	}

	restoreColorsProto()
}
