import { PassThrough } from "node:stream"
import path from "node:path"
import { fail } from "../source/check.mjs"
import { exec } from "../source/exec.mjs"
import { fileURLToPath } from "node:url"

export async function exec_run_withLogTrap(testFiles) {
	const stdout = new PassThrough().setEncoding("utf8")
	let log = ""
	stdout.on("data", x => log += x)
	await exec(testFiles, { stdout })
	return log
}

export function existsInLog({str}, log) {
	return log.includes(str)
}

export function findSectionInLog(str, log, {startsWith}) {

	let found = []

	const logsL = log.length
	for (let i = 0; i < logsL; i++) {
		const val = log[i]
		if (startsWith && val.startsWith(str)) {
			found.push({ i, val })
		}
		if (val === str) {
			found.push({ i, val })
		}
	}

	if (found.length === 0) {
		fail(`section not found in report logs \n ${str}`)
	}
	if (found.length > 1) {
		fail(`two identical messages printed in report logs \n ${str}`)
	}

	return found[0].i
}

export const toRelPathFromProjRoot = fileURL => filePath => {
	const _dirname = path.dirname(fileURLToPath(fileURL))
	const projectRoot = process.cwd()
	const relDirFromProjRoot = _dirname.replaceAll(projectRoot, "")
	return path.join(relDirFromProjRoot, filePath)
}

export function fn1() {}
export function fn2() {}
export function fn3() {}
export function fn4() {}
export function fn5() {}
