import { run } from "../source/index.js"

let testFiles = [
	"tests/suite.test.js",
	"tests/check.test.js",
	"tests/collectSuites.test.js",
	"tests/stringifyFailsData.test.js",
	"tests/report.test.js",
]

run(testFiles)
