import OS from "node:os"
import fs from "node:fs/promises"
import path from "node:path"
import { defaultConfig } from "./defaultConfig.mjs"
import { exec } from "./exec.mjs"

export async function run() {

	process.env.UV_THREADPOOL_SIZE = OS.cpus().length

	const sophiConfig = await lookConfig()
	const testFiles = await lookupTestFiles(sophiConfig)
	await exec(testFiles)
}


async function lookConfig() {

	let config = defaultConfig

	try {
		config = await import(path.join(process.cwd(), "./sophi.config.js"))
	}
	finally {
		return config
	}
}

async function lookupTestFiles(sophiConfig) {

	const {testFiles: {folders, subString, extensions}} = sophiConfig

	let files = await Promise.all(folders.map(async folder => lookRecursive(folder)))
	files = files.flat().filter(hasCorrectNamesAndExtensions)
	return files

	async function lookRecursive(dirPath) {
		const files = await fs.readdir(dirPath, { withFileTypes: true })
		const fileNames = await Promise.all(files.map(async file => {
			const filePath = path.join(dirPath, file.name)
			if (file.isDirectory()) {
				return lookRecursive(filePath)
			} else {
				return filePath
			}
		}))
		return fileNames.flat()
	}

	function hasCorrectNamesAndExtensions(file) {
		const fileExt = path.extname(file).slice(1)
		if (!extensions.includes(fileExt)) {
			return false
		}
		for (const str of subString) {
			if (file.includes(str)) {
				return true
			}
		}
		return false
	}
}
