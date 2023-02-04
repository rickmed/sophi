// FAIL LOUDLY on unhandled promise rejections / errors

process.on("unhandledRejection", (reason) => {
	console.error("vitest-setup-file: FAILED TO HANDLE PROMISE REJECTION")
	throw reason
})
