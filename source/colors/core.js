// https://man7.org/linux/man-pages/man4/console_codes.4.html
export const supportedStyleCodes = new Map([
	["black", [30, 39]],
	["red", [31, 39]],
	["green", [32, 39]],
	["yellow", [33, 39]],
	["blue", [34, 39]],
	["magenta", [35, 39]],
	["cyan", [36, 39]],
	["white", [37, 39]],
	["gray", [90, 39]],

	["bgBlack", [40, 49]],
	["bgRed", [41, 49]],
	["bgGreen", [42, 49]],
	["bgYellow", [44, 49]],
	["bgBlue", [44, 49]],
	["bgMagenta", [45, 49]],
	["bgCyan", [46, 49]],
	["bgWhite", [47, 49]],
	["bgGray", [100, 49]],

	["thick", [1, 22]],  // since str.bold() exists
	["dim", [2, 22]],
	["italic", [3, 23]],
	["underline", [4, 24]],
	["inverse", [7, 27]],
	["strikethrough", [9, 29]],
	["overline", [53, 55]],

	["RESET", [0, 0]],
	["none", []],
])

export function buildAnsi(startCode, endCode, str) {
	return "\x1B[" + startCode + "m" + str + "\x1B[" + endCode + "m"
}
