# CodinIT API

The CodinIT extension exposes an API that can be used by other extensions. To use this API in your extension:

1. Copy `src/extension-api/CodinIT.d.ts` to your extension's source directory.
2. Include `CodinIT.d.ts` in your extension's compilation.
3. Get access to the API with the following code:

    ```ts
    const CodinITExtension = vscode.extensions.getExtension<CodinITAPI>("saoudrizwan.claude-dev")

    if (!CodinITExtension?.isActive) {
    	throw new Error("CodinIT extension is not activated")
    }

    const CodinIT = CodinITExtension.exports

    if (CodinIT) {
    	// Now you can use the API

    	// Set custom instructions
    	await CodinIT.setCustomInstructions("Talk like a pirate")

    	// Get custom instructions
    	const instructions = await CodinIT.getCustomInstructions()
    	console.log("Current custom instructions:", instructions)

    	// Start a new task with an initial message
    	await CodinIT.startNewTask("Hello, CodinIT! Let's make a new project...")

    	// Start a new task with an initial message and images
    	await CodinIT.startNewTask("Use this design language", ["data:image/webp;base64,..."])

    	// Send a message to the current task
    	await CodinIT.sendMessage("Can you fix the @problems?")

    	// Simulate pressing the primary button in the chat interface (e.g. 'Save' or 'Proceed While Running')
    	await CodinIT.pressPrimaryButton()

    	// Simulate pressing the secondary button in the chat interface (e.g. 'Reject')
    	await CodinIT.pressSecondaryButton()
    } else {
    	console.error("CodinIT API is not available")
    }
    ```

    **Note:** To ensure that the `saoudrizwan.claude-dev` extension is activated before your extension, add it to the `extensionDependencies` in your `package.json`:

    ```json
    "extensionDependencies": [
        "saoudrizwan.claude-dev"
    ]
    ```

For detailed information on the available methods and their usage, refer to the `CodinIT.d.ts` file.
