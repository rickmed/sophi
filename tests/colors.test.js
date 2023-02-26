import { group, test, check_is, check_Throws } from "../source/index.js"
import { setColorsProto, restoreColorsProto, ink } from "../source/colors/pure.js"


group("Proxy forwards correctly to original Object.Prototype's: ", () => {

	test("methods", () => {

		setColorsProto()

		// eslint-disable-next-line no-prototype-builtins
		check_is("a".hasOwnProperty("some prop"), false)

		restoreColorsProto()
	})


	test("properties", () => {

		setColorsProto()
		const str = "a"
		const strProto = Object.getPrototypeOf(str)
		const origStrCtor = strProto.constructor
		delete strProto.constructor

		check_is(str.constructor, Object)

		strProto.constructor = origStrCtor
		restoreColorsProto()
	})
})


test("setColorsProto() and restoreColorsProto() are idempotent", () => {

	setColorsProto()
	setColorsProto()

	check_is("A".red, "\u001B[31mA\u001B[39m")

	restoreColorsProto()
	restoreColorsProto()

	check_is("a".red, undefined)
})


group("mehod based api works", () => {

	test("supported style returns correct ansi", () => {
		check_is(ink.red("A"), "\u001B[31mA\u001B[39m")
	})


	test("throws if non supported style code", () => {
		const err = check_Throws(() => ink.nonExistent("A"))
		check_is(err.message, "sophi/colors: style not supported")
	})
})
