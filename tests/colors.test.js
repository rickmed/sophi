import { it as test, expect, describe as group } from "vitest"
import { setColorsProto, restoreColorsProto, ink } from "../source/colors.js"


group("Proxy forwards correctly to original Object.Prototype's: ", () => {

	test("methods", () => {

		setColorsProto()

		// eslint-disable-next-line no-prototype-builtins
		expect("a".hasOwnProperty("some prop")).toBe(false)

		restoreColorsProto()
	})


	test("properties", () => {

		setColorsProto()
		const str = "a"
		const strProto = Object.getPrototypeOf(str)
		const origStrCtor = strProto.constructor
		delete strProto.constructor

		expect(str.constructor).toEqual(Object)

		strProto.constructor = origStrCtor
		restoreColorsProto()
	})
})


test("setColorsProto() and restoreColorsProto() are idempotent", () => {

	setColorsProto()
	setColorsProto()

	expect("A".red).toBe("\u001B[31mA\u001B[39m")

	restoreColorsProto()
	restoreColorsProto()

	expect("a".red).toBe(undefined)
})


group("mehod based api works", () => {

	test("supported style returns correct ansi", () => {
		expect(ink.red("A")).toBe("\u001B[31mA\u001B[39m")
	})


	test("throws if non supported style code", () => {
		const errMsg = "sophi/colors: style not supported"
		expect(() => ink.nonExistent("A")) .toThrowError(errMsg)
	})
})
