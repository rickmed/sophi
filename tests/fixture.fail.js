import { group, test, check } from "../source/index.js"

group("group1", () => {
	test("Test title", () => {
		check(23099).with(131)
	})
})

test("Test title 2", () => {

	const rec = {
		k1: 10,
		k3: {
			kk3: true,
		},
	}

	const exp = {
		k1: 11,
		k2: "k2",
	}

	check(rec).with(exp, "user message")
})

test("Test title 3", async () => {
	await Promise.resolve(1)
	check(230).with(13199)
})
