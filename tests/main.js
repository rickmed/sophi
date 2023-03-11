import { run } from "../source/index.js"

let testFiles = [
	"tests/FileSuite.test.js",
	"tests/collectSuites.test.js",
	"tests/check.test.js",
	"tests/stringifyFailsData.test.js",
	"tests/report.test.js",
]

run(testFiles)
