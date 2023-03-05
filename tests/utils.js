import path from "node:path"
import { fileURLToPath } from "node:url"


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
