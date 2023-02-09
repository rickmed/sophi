import { it as test, expect } from "vitest"
import { setColorsProto, restoreColorsProto, RESET } from "../source/colors.js"

test("handles access to Object.Prototype", () => {

	setColorsProto()

	const str = ""

	// eslint-disable-next-line no-prototype-builtins
	expect(str.isPrototypeOf(Number)).toBe(false)

	const strProto = Object.getPrototypeOf(str)
	const origStrCtor = strProto.constructor
	delete strProto.constructor

	expect(str.constructor).toEqual(Object)

	strProto.constructor = origStrCtor

	restoreColorsProto()
})

test("setColorsProto() and restoreColorsProto() are idempotent", () => {

	setColorsProto()
	setColorsProto()

	expect("a".bgMagenta.includes(RESET)).toBe(true)

	restoreColorsProto()
	restoreColorsProto()

	expect("a".bgMagenta).toBe(undefined)
})
