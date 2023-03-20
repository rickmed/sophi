import { readFile } from "node:fs/promises"
import { EOL } from "node:os"
import { inspect } from "node:util"
import { ERR_ASSERTION_SOPHI, OP, EMPTY } from "./check.mjs"
import { ink } from "./ink.mjs"

const NL = "\n"
const NLx2 = NL + NL
const INDENT = "  "

/*
in: test::  {ID::int, name, fn, g: groupID, err}
out: test:: {...failMsg, failLine, failCol}
*/
export async function stringifyFailedTests(suite) {
	await addFileContents(suite)
	_stringifyFailedTests(suite.fileSuites)
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

function _stringifyFailedTests(fileSuites) {

	for (const [filePath, fileSuite] of fileSuites) {

		const {file_content, failedTests, groups} = fileSuite

		const fileContentLinesArr = file_content.split(EOL)

		for (let test of failedTests) {

			const {err} = test

			const [line, col] = getFailLocation(err, filePath)

			const errStrTitle = `${ink(" Fail ").red.inverse_} ${ink(`${filePath}:${line}:${col}`).red.bold_} ${ink("─".repeat(50)).red_}` + NLx2

			let errStrBody = ""
			const groupNamePath = groups.get(test.g).namePath
			errStrBody += fullNameToStr([...groupNamePath, test.name])
			errStrBody += NLx2
			errStrBody += indentStr(AssertionZone_Str(line, fileContentLinesArr))
			errStrBody += NLx2
			errStrBody += ErrorDiagnostics_Str(err)
			errStrBody += NLx2
			errStrBody += stack_Str(err)

			errStrBody = indentStr(errStrBody)

			test.failMsg =  errStrTitle + errStrBody
		}

		delete fileSuite.file_content
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

		return [Number(line), Number(col)]
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
				lines.push(ink(ink(arrowMark).red_ + i + ": " + codeLine).bold_)
				continue
			}

			lines.push(ink(leftSpace + i + ": " + codeLine).dim_)
		}

		return lines.join(NL)
	}

	function stack_Str(testErr) {

		let stackStr = testErr.stack.split(NL)
			.map(l => l.trim())
			.filter(l => l.startsWith("at"))
			.map(l => l.trim())
			.join(NL)

		stackStr = ink(stackStr).dim_

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
					ink(message).yellow.bold_
		str += NLx2
		str += Comparates_Str(expected, received)
	}
	else {
		str += inspect(testErr)
	}

	return str


	function Comparates_Str(exp, rec) {

		let str = ""

		const opts = { depth: 50, compact: false, colors: true, sorted: true }

		str += ink("Expected").green.bold_
		str += NLx2
		str += indentStr(typeof exp === "string" ? exp : inspect(exp, opts))
		str += NLx2
		str += ink("Received").red.bold_
		str += NLx2
		str += indentStr(typeof rec === "string" ? rec : inspect(rec, opts))

		return str
	}
}

export function fullNameToStr(fullNameArr) {
	return fullNameArr.map(n => ink(n).yellow_).join(ink(" ▶ ").red.dim_)
}

export function Satisfies_Str(testErr) {
	const { userMsg, validatorName, args } = testErr.expected

	const insp_opts = {
		depth: 50,
		compact: false,
		colors: true,
		sorted: true,
	}

	let titleStr = userMsg ? `${userMsg}` : `Expected to pass ${ink(validatorName).bold_}`
	if (args) titleStr += " with arguments"
	titleStr += ":"

	let expectedStr = ""

	if (args) {
		const argAndItsValStrings = []
		for (const k in args) {
			const argName = k + ":"
			const argValStr = typeof args[k] === "string" ? args[k] : inspect(args[k], insp_opts)
			argAndItsValStrings.push(argName + NL + indentStr(argValStr))
		}
		expectedStr += argAndItsValStrings.join(NL)
	}

	if (expectedStr !== "") {
		expectedStr = markWithColor("green", expectedStr)
	}

	const rec = testErr.received
	let receivedStr = typeof rec === "string" ? rec : inspect(testErr.received, insp_opts)
	receivedStr = markWithColor("red", receivedStr)

	const bodyStr = expectedStr === "" ? receivedStr : expectedStr + NL + receivedStr

	return ink(titleStr).yellow_ + NLx2 + indentStr(bodyStr)
}

export function Check_Str(testErr) {
	const { issues, expFn, message } = testErr

	let str = ""

	if (expFn) {
		str += ink(`Expected to pass ${ink(expFn.name).bold_}`).yellow_
	}
	else {
		str += ink(message).yellow.bold_
	}

	str += NLx2 + indentStr(buildIssuesMsg(issues))

	return str
}

function buildIssuesMsg(issues) {

	let str = ""
	if (issues.type !== "Leaf") str += ink(topBrace(issues.type)).red_
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
			}
			else {
				const opts = { depth: 50, compact: false, colors: true, sorted: true }
				expStr = exp === EMPTY ? "" : inspect(exp, opts)
				recStr = rec === EMPTY ? "" : inspect(rec, opts)
			}

			expStr = markWithColor("green", expStr)
			expStr = indentStr(expStr, ind)
			recStr = markWithColor("red", recStr)
			recStr = indentStr(recStr, ind)

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

			str += ink(ind + kStr + NL).red_
		}

		function addCloseBracket(type) {
			let _str = type === "Array" ? "]" : "}"
			str += ink("  ".repeat(level - 1) + _str + NL).red_
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
			recNew += ink(recMarked).underline_
			expNew += ink(expMarked).underline_
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

	markedRestOfLongStr = ink(markedRestOfLongStr).underline_

	if (longStr === rec) {
		recNew += markedRestOfLongStr
	}
	else {
		expNew += markedRestOfLongStr
	}

	return [recNew, expNew]
}

function markWithColor(color, str) {
	const colorMark = color === "red" ? ink("▓").inverse.red_ : ink(" ").inverse.green_
	return str.split(NL).map(l => colorMark + INDENT + l).join(NL)
}

function indentStr(str, _indent) {
	_indent = _indent || INDENT
	return str.split(NL).map(l => _indent + l).join(NL)
}
