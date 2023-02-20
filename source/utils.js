export const SOPHI = Symbol("sophi")

export function relPathFromProjectRoot(filePath) {
	return filePath.replaceAll(globalThis[SOPHI].projectRoot, "")
}
