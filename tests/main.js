import { readFile } from "node:fs/promises"
import { run, report } from "../source/index.js"
import { absPathFromRel } from "./utils.js"
import { setColorsProto } from "../source/colors/pure.js"
import { relPathFromProjectRoot } from "../source/utils.js"

const absFilePath_s = [
	"./colors.test.js",
	"./deepDiff.test.js",
	"./check.test.js",
	"./suite.test.js",
	"./integration/run.test.js",
	"./integration/report.test.js",
]
.map(path => absPathFromRel(import.meta.url, path))

try {
	const [suite, fileContent] = await Promise.all([
		run(absFilePath_s),
		getFilesAndContents(absFilePath_s),
	])

	for (let { path, content } of fileContent) {
		const _path = relPathFromProjectRoot(path)
		const fileSuite = suite.suites.get(_path)

		// because if one|just is used, only one fileSuite is returned from run()
		if (fileSuite) {
			fileSuite.file_content = content
		}
	}

// need to do this instead of importing impure colors bc colors.test.js interferes by resetColorsProto()
	setColorsProto()

	report(suite)
}
catch (e) {
	// eslint-disable-next-line no-console
	console.dir(e)
	process.exitCode = 1
}


async function getFilesAndContents(absPaths) {
	return Promise.all(absPaths.map(async path => {
		return {
			path,
			content: await readFile(path, "utf8"),
		}
	}))
}
