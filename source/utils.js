export const SOPHI = Symbol("sophi")

export function relPathFromProjectRoot(filePath, projectRoot = process.cwd()) {
	return filePath.replaceAll(projectRoot, "").slice(1)
}
