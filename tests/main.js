import { run } from "../source/index.js"

let testFiles = [
	"tests/check.test.js",
	"tests/FileSuite.test.js",
	"tests/collectSuites.test.js",
	"tests/stringifyFailedTests.test.js",
	"tests/report.test.js",
]

run(testFiles)
