import { describe, test, expect } from "vitest"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { report } from "./reporter.js"
import { run } from "./runner.js"
import { setStringPrototype as setColorsPrototype, restoreStringPrototype } from "./colors.js"
import { OP_EQ_MSG } from "./checker.js"

describe("report() - prints Failed tests correctly", async () => {

	test("with a sophi/checker assertion", async () => {
		const { suite, logs } = await setup(["./sophiAssertion.fixture.js"])

		const failLocReport = [
			"   \x1B[2m    4:    \"This is an example title provided by the user\"() {\x1B[m\n",
			"   \x1B[1m\x1B[31m  > \x1B[m5:       check_Eq(1, 2)\x1B[m\n",
			"   \x1B[2m    6:    },\x1B[m\n",
		]

		const logsIdx = check_titlesAndLoc({failLine: 5, failCol: 3, failLocReport}, logs, suite[0])
		check_assertionDetails(logs, logsIdx)

		cleanup()
	})

	test("with a NON sophi/checker assertion", async () => {
		const { suite, logs } = await setup(["./3rdPartyAssertion.fixture.js"])

		const failLocReport = [
			"   \x1B[2m    4:    \"Example test title\"() {\x1B[m\n",
			"   \x1B[1m\x1B[31m  > \x1B[m5:       expect(1).toBe(2)\x1B[m\n",
			"   \x1B[2m    6:    },\x1B[m\n",
		]

		const logsIdx = check_titlesAndLoc({failLine: 5, failCol: 13, failLocReport}, logs, suite[0])
		check_anErrorIsPresent(logs, logsIdx)

		cleanup()
	})

	// helpers
	const nl = "\n"
	const margin = " ".repeat(3)

	function check_titlesAndLoc({failLine, failCol, failLocReport}, logs, fileSuite) {
		const { filePath, tests } = fileSuite
		let logsIdx = 0

		check_nl(); then()
		check_resultTitle(); then()
		check_nl(); then()
		check_testTitle(); then()
		check_nl(margin); then()
		check_failLoc(); then()
		check_nl(margin); then()

		return logsIdx

		function check_nl(margin = "") {
			const rec = logs[logsIdx]
			const exp = margin + nl
			expect(rec).toEqual(exp)
		}
		function then() {
			logsIdx++
		}
		function check_resultTitle() {
			const rec = logs[logsIdx]
			const fileLoc = `${filePath}:${failLine}:${failCol}`.red.thick
			const exp = `${" FAIL ".red.inverse} ${fileLoc} ${"──────────".red}\n`
			expect(rec).toBe(exp)
		}
		function check_testTitle() {
			const rec = logs[logsIdx]
			const exp = margin + `"${tests[0].title}"`.yellow.thick + nl
			expect(rec).toBe(exp)
		}
		function check_failLoc() {
			const rec = logs.slice(logsIdx, logsIdx + 3)
			expect(rec).toEqual(failLocReport)
			logsIdx += 2
		}
	}

	function check_assertionDetails(logs, logsIdx) {

		check_message(); then()
		check_received(); then()
		check_receivedVal(); then()
		check_expected(); then()
		check_expectedVal(); then()
		check_nl(margin); then()
		check_topStack()
		check_bottom_nl()

		function then() {
			logsIdx++
		}
		function check_message() {
			const rec = logs[logsIdx]
			const exp = margin + OP_EQ_MSG.yellow + nl
			expect(rec).toBe(exp)
		}
		function check_received() {
			const rec = logs[logsIdx]
			const exp = margin +  "received:".green.thick + nl
			expect(rec).toBe(exp)
		}
		function check_receivedVal() {
			const rec = logs[logsIdx]
			const exp = margin + margin + "1" + nl


			expect(rec).toBe(exp)
		}
		function check_expected() {
			const rec = logs[logsIdx]
			const exp = margin +  "expected:".red.thick + nl
			expect(rec).toBe(exp)
		}
		function check_expectedVal() {
			const rec = logs[logsIdx]
			const exp = margin + margin + "2" + nl
			expect(rec).toBe(exp)
		}
		function check_nl(margin = "") {
			const rec = logs[logsIdx]
			const exp = margin + nl
			expect(rec).toEqual(exp)
		}
		function check_topStack() {
			const rec = logs[logsIdx]
			expect(rec.startsWith(margin + "\x1B[2mat _CheckErr")).toBe(true)
		}
		function check_bottom_nl() {
			const rec = logs[logs.length - 1]
			const exp = nl
			expect(rec).toBe(exp)
		}
	}
	function check_anErrorIsPresent(logs, logsIdx) {
		expect(logs[logsIdx]).toMatch(/Error/)
	}
})

describe("report()", () => {

	test("prints Passed tests correctly", async () => {
		const { suite, logs } = await setup([
			"./passedTests.fixture.js",
			"./passedTests2.fixture.js",
		])

		expect(logs.length).toBe(2)
		expect(logs[0]).toBe(`${"√".green.thick} ${suite[0].filePath} ${"(2)".dim}\n`)
		expect(logs[1]).toBe(`${"√".green.thick} ${suite[1].filePath} ${"(1)".dim}\n`)
	})
})


// helpers
async function setup(fixturesPaths) {

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
			fileSuite.filePath = x
		}
		if (i % 3 === 1) {
			fileSuite.fileContents = x
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
	// for check_resultTitle() to have a deterministic "──────────" length
	process.stdout.columns = null
	report(suiteResults)
	process.stdout.write = origStdOutWrite


	setColorsPrototype()

	/*
	suite:: [
		filePath: 'source/passedTests.fixture.js',
		fileContents: "...",
		tests: [
			{
				title: 'Example test title',
				fn: [Function: Example test title],
				status: 'SOPHI_TEST_PASSED'
			},
		]
	]
	*/
	return { suite, logs }

	// helpers
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
	restoreStringPrototype()
}
