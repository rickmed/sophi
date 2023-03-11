import { readFile } from "node:fs/promises"
import { EOL } from "node:os"
import { inspect } from "node:util"
import { ERR_ASSERTION_SOPHI, OP, EMPTY } from "./check.js"
import "./colors/colors.js"

const NL = "\n"
const INDENT = "  "

/*
in:
suites:: Map ('/projecRoot/tests/testFile.test.js' -> {
	clusters: {
		failed:: testID -> err,
		passed:: Set(testID),
		skip:: Set(testID),
		todo:: Set(testID),
	},
	n_Tests: number,
})

out:
suites:: Map ('/projecRoot/tests/testFile.test.js' -> {
	clusters: {
		failed:: testID -> {failLoc: {col, line}, failMsg},
		passed:: Set(testID),
		skip:: Set(testID),
		todo:: Set(testID),
	},
	n_Tests: number,
	file_content:: string,
})
*/
export async function stringifyFailsData(suite) {
	await addFileContents(suite)
	_stringifyFailsData(suite.fileSuites)
}


async function addFileContents(suite) {
	const { fileSuites } = suite

	let path_s = []
	for (const [filePath] of fileSuites) {
		path_s.push([filePath, suite.absPathFromProjRootDir(filePath)])
	}

	const res = await Promise.all(path_s.map(async ([filePath, absPath]) => {
		return {
			filePath,
			content: await readFile(absPath, "utf8"),
		}
	}))

	for (const { filePath, content } of res) {
		fileSuites.get(filePath).file_content = content
	}
}

function _stringifyFailsData(fileSuites) {

	for (const [filePath, fileSuite] of fileSuites) {
		const {file_content, failedTests, groups} = fileSuite

		const fileContentLinesArr = file_content.split(EOL)

		for (let test of failedTests) {

			const {err} = test

			const failLoc = getFailLocation(err, filePath)

			let errStr = ""

			const groupNamePath = groups.get(test.g).namePath
			errStr += [...groupNamePath, test.name].join(" ▶ ").yellow.thick
			errStr += NL + NL
			errStr += indentStr(AssertionZone_Str(failLoc.line, fileContentLinesArr))
			errStr += NL + NL
			errStr += ErrorDiagnostics_Str(err)
			errStr += NL + NL
			errStr += stack_Str(err)

			test.failLoc = failLoc
			test.failMsg = errStr
		}
	}

	function getFailLocation(testErr, filePath) {

		let failLine = testErr.stack
			.split(NL)
			.find(x => x.includes(filePath))

		if (!failLine) {
			throw new Error("An error occurred outside test files: ", { cause: testErr })
		}

		failLine = failLine.split(":")
		const line = failLine[failLine.length - 2]
		const col = failLine[failLine.length - 1].replaceAll(")", "")

		return {
			line: Number(line),
			col: Number(col),
		}
	}

	function AssertionZone_Str(failLine, fileContentLinesArr, printNLines = 3) {

		const fileLines = fileContentLinesArr

		const lowestLineIdx = failLine - Math.floor(printNLines / 2)
		const highestLineIdx = lowestLineIdx + printNLines - 1

		const arrowMark = "> "
		const leftSpace = " ".repeat(arrowMark.length)
		let lines = []
		for (let i = lowestLineIdx; i <= highestLineIdx; i++) {

			const codeLine = fileLines[i - 1]

			if (i === failLine) {
				lines.push((arrowMark.red + i + ": " + codeLine).thick)
				continue
			}

			lines.push((leftSpace + i + ": " + codeLine).dim)
		}

		return lines.join(NL)
	}

	function stack_Str(testErr) {

		const stackStr = testErr.stack.split(NL)
			.map(l => l.trim())
			.filter(l => l.startsWith("at"))
			.map(l => l.trim())
			.join(NL)
			.dim

		return stackStr
	}
}

function ErrorDiagnostics_Str(testErr) {

	let str = ""

	if (testErr.name === ERR_ASSERTION_SOPHI) {
		const { expected, received, message, operator } = testErr

		str +=
			operator === OP.SATISFIES ? Satisfies_Str(testErr) :
				operator === OP.CHECK ? Check_Str(testErr) :
					message.yellow
		str += NL + NL
		str += indentStr(Comparates_Str(expected, received))
	}
	else {
		str += inspect(testErr)
	}

	return str


	function Comparates_Str(exp, rec) {

		let str = ""

		const opts = { depth: 50, compact: false, colors: true, sorted: true }

		str += "Expected".green.thick
		str += NL + NL
		str += indentStr(inspect(exp, opts))
		str += NL + NL
		str += "Received".red.thick
		str += NL + NL
		str += indentStr(inspect(rec, opts))

		return str
	}
}

export function Satisfies_Str(testErr) {
	const { userMsg, validatorName, args } = testErr.expected

	const opts = {
		depth: 50,
		compact: false,
		colors: false,
		sorted: true,
	}

	let ind = INDENT
	let indx2 = ind + ind

	let headline = ""
	let expMsg = ""

	if (!userMsg) {

		headline += `Expected to pass ${validatorName.thick}`

		const green = " ".inverse.green

		if (args) {

			headline += " with arguments"

			for (const k in args) {
				expMsg += green + ind + k + ":" + NL
				expMsg += green + indx2 + inspect(args[k], opts) + NL
			}
		}

		headline = (headline + ":").yellow
	}
	else {
		headline = (userMsg + ":").yellow
	}

	const recStr = inspect(testErr.received, opts).split(NL)
		.map(l => "▓".inverse.red + " " + l).join(NL)

	return headline + NL + expMsg + recStr
}

export function Check_Str(testErr) {
	const { issues, expFn, message } = testErr

	let str = ""

	if (expFn) {
		str += `Expected to pass ${expFn.name.thick}`.yellow
	}
	else {
		str += message.yellow
	}

	str += NL + NL + indentStr(buildIssuesMsg(issues))

	return str
}

function buildIssuesMsg(issues) {

	const pathColor = "red"

	let str = ""
	str += topBrace(issues.type)[pathColor]
	str += NL
	buildMsg(issues)
	return str


	function topBrace(type) {
		return type === "Object" ? "{" : type === "Map" ? "Map {" : "["
	}

	function buildMsg(issues, level = 1) {
		const { type } = issues

		const ind = "  ".repeat(level)

		if (type === "Leaf") {
			buildLeafStr(issues)
			return
		}
		if (type === "Satisfies") {
			str += NL + issues.message
			return
		}

		for (const [k, _issues] of issues.diffs) {
			buildkStr(k, _issues.type, type)
			buildMsg(_issues, level + 1)
		}
		addCloseBracket(type)


		function buildLeafStr({ exp, rec }) {

			let expStr, recStr

			if (bothCanStringDiff(exp, rec)) {
				[recStr, expStr] = markStrsDiffs(exp, rec)
				;[recStr, expStr] = [`'${recStr}'`, `'${expStr}'`]
			}
			else {
				const opts = { depth: 50, compact: false, colors: false, sorted: true }
				expStr = exp === EMPTY ? "" : inspect(exp, opts)
				recStr = rec === EMPTY ? "" : inspect(rec, opts)
			}

			expStr = expStr.split(NL).map(l => ind + " ".inverse.green + " " + l).join(NL)
			recStr = recStr.split(NL).map(l => ind + "▓".inverse.red + " " + l).join(NL)

			// this line prints the if rec above or viceversa
			str += expStr + NL + recStr + NL
		}
		function buildkStr(k, diffType, parentType) {

			let kStr = ""

			kStr += inspect(k, { depth: 1, compact: true, colors: false })

			kStr += ": "

			if (parentType === "Map") {
				kStr += "=> "
			}

			if (diffType === "Object") kStr += "{"
			if (diffType === "Array") kStr += "["
			if (diffType === "Map") kStr += "Map {"

			str += (ind + kStr + NL)[pathColor]
		}
		function addCloseBracket(type) {
			let _str = type === "Array" ? "]" : "}"
			str += ("  ".repeat(level - 1) + _str + NL)[pathColor]
		}
	}
}

function bothCanStringDiff(exp, rec) {

	const recType = typeof rec
	const expType = typeof exp

	if (recType !== expType) {
		return false
	}

	const type = recType
	if (type === "string" || type === "number" || type === "bigint" || type === "symbol") {
		return true
	}

	return false
}

function markStrsDiffs(exp, rec) {

	const style = "underline"

	rec = rec.toString()
	exp = exp.toString()

	const recL = rec.length
	const expL = exp.length

	let shortStr = rec
	let longStr = exp
	if (recL > expL) {
		[shortStr, longStr] = [exp, rec]
	}

	const shortL = shortStr.length

	let recNew = ""
	let expNew = ""

	let i = 0
	while (i < shortL) {

		if (rec[i] !== exp[i]) {
			let recMarked = ""
			let expMarked = ""

			while (rec[i] !== exp[i] && i < shortL) {
				recMarked += rec[i]
				expMarked += exp[i]
				i++
			}
			recNew += (recMarked[style])
			expNew += (expMarked[style])
			continue
		}

		recNew += rec[i]
		expNew += exp[i]
		i++
	}

	const longL = longStr.length
	let markedRestOfLongStr = ""
	while (i < longL) {
		markedRestOfLongStr += longStr[i]
		i++
	}

	markedRestOfLongStr = markedRestOfLongStr[style]

	if (longStr === rec) {
		recNew += markedRestOfLongStr
	}
	else {
		expNew += markedRestOfLongStr
	}

	return [recNew, expNew]
}

function indentStr(str) {
	return str.split(NL).map(l => INDENT + l).join(NL)
}
