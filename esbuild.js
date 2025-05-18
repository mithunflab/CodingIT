// esbuild.js
const esbuild = require("esbuild")
const path = require("path")

// Determine if we're in production mode based on CLI arguments
const production = process.argv.includes("--production")
const watchMode = process.argv.includes("--watch")

async function build() {
	try {
		const context = await esbuild.context({
			entryPoints: [path.resolve(__dirname, "src/extension.ts")],
			bundle: true,
			outfile: path.resolve(__dirname, "dist/extension.js"),
			external: ["vscode"], // vscode module is provided by VS Code runtime
			format: "cjs", // VS Code extensions use CommonJS
			platform: "node", // Target Node.js environment
			sourcemap: !production, // Generate sourcemaps if not in production
			minify: production, // Minify code if in production
			// Define other esbuild options as needed
		})

		if (watchMode) {
			await context.watch()
			console.log("Watching for changes...")
		} else {
			await context.rebuild()
			await context.dispose()
			console.log("Build succeeded.")
		}
	} catch (e) {
		console.error("Build failed:", e)
		process.exit(1)
	}
}

build()
