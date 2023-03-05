import { supportedStyleCodes, buildAnsi } from "./core.js"

const ObjectProto = Object.prototype
const ObjectProtoKs = new Set(Object.getOwnPropertyNames(ObjectProto))

const proxyHandler = {

	get(t, k, str) {

		if (ObjectProtoKs.has(k)) {
			return Reflect.get(t, k, str)
		}

		if (k === "none") return str
		const codes = supportedStyleCodes.get(k)
		if (codes) {
			return buildAnsi(codes[0], codes[1], str)
		}
	},
}

const proxy = new Proxy({}, proxyHandler)
Object.setPrototypeOf(String.prototype, proxy)
