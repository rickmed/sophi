// https://man7.org/linux/man-pages/man4/console_codes.4.html
export let styleCodes = new Map([
	["black", "30"],
	["red", "31"],
	["green", "32"],
	["yellow", "33"],
	["blue", "34"],
	["magenta", "35"],
	["cyan", "36"],
	["white", "37"],
	["gray", "90"],

	["bgBlack", "40"],
	["bgRed", "41"],
	["bgGreen", "42"],
	["bgYellow", "44"],
	["bgBlue", "44"],
	["bgMagenta", "45"],
	["bgCyan", "46"],
	["bgWhite", "47"],
	["bgGray", "100"],

	["thick", "1"],  // since str.bold() exists
	["dim", "2"],
	["italic", "3"],
	["underline", "4"],
	["inverse", "7"],
	["strikethrough", "9"],
	["overline", "53"],
])

export const RESET = "\x1b[m"


const ObjectProto = Object.prototype
const ObjectProtoKs = new Set(Object.getOwnPropertyNames(ObjectProto))

let proxyCreated = false

export function setStringPrototype() {

	if (proxyCreated) return
	proxyCreated = true

	const proxyHandler = {

		get(_, k, receiver) {

			if (typeof k === "symbol") {
				return
			}

			const styleCode = styleCodes.get(k)
			if (styleCode !== undefined) {
				return "\x1b[" + styleCode + "m" + receiver + RESET
			}

			if (ObjectProtoKs.has(k)) {
				if (typeof ObjectProto[k] === "function") {
					return (...args) => ObjectProto[k].call(receiver, ...args)
				}
				return ObjectProto[k]
			}

			const msgTitle = `"${k}" style not supported by sophi/colors package.\n`
			const msgInfo = "This is a JS Proxy in Object.prototype"
			return msgTitle + msgInfo
		}
	}

	const proxy = new Proxy({}, proxyHandler)
	Object.setPrototypeOf(String.prototype, proxy)
}

export function restoreStringPrototype() {
	if (!proxyCreated) return
	Object.setPrototypeOf(String.prototype, Object.getPrototypeOf({}))
}
