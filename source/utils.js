export const SOPHI = "@$oph!"
export const SEP = " @$oph! "

export function fullTestStr(testID) {
	let { testTitle, groups } = extractTestTitleAndGroups(testID)
	groups = groups.join(" ▶ ")
	groups = groups === "" ? "" : (groups + " ▶ ")
	testTitle = `${groups}${testTitle}`
	return testTitle
}

export function extractTestTitleAndGroups(testID) {
	let arr = testID.split(SEP)
	const testTitle = arr[arr.length - 1]
	arr.pop()
	const groups = arr
	return {testTitle, groups}
}
