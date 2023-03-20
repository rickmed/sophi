import { topic, test, check } from "../source/index.mjs"
import { toRelPathFromProjRoot } from "./utils.mjs"
import { collectSuites } from "../source/collectSuites.mjs"
import { newSuite } from "../source/_run.mjs"

const _toRelPathFromProjRoot = toRelPathFromProjRoot(import.meta.url)

topic("collectSuites()", () => {

	test("only() works across files: it should select only the files that use it", async () => {

		let filePath_s = ["./fixture.only.mjs", "./fixture.pass.mjs"]
			.map(_toRelPathFromProjRoot)

		const suite = await setup(filePath_s)

		check(suite.fileSuites.size).with(1)
		check(suite.onlyUsed).with(true)
	})
})


async function setup(filePath_s) {
	const suite = newSuite()
	await collectSuites(suite, filePath_s)
	return suite
}
