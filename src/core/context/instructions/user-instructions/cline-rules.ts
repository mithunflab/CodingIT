import path from "path"
import { ensureRulesDirectoryExists, GlobalFileNames } from "@core/storage/disk"
import { fileExistsAtPath, isDirectory, readDirectory } from "@utils/fs"
import { formatResponse } from "@core/prompts/responses"
import fs from "fs/promises"
import { CodinITRulesToggles } from "@shared/CodinIT-rules"
import { getGlobalState, getWorkspaceState, updateGlobalState, updateWorkspaceState } from "@core/storage/state"
import * as vscode from "vscode"

/**
 * Converts .CodinITrules file to directory and places old .CodinITrule file inside directory, renaming it
 * Doesn't do anything if .CodinITrules dir already exists or doesn't exist
 * Returns whether there are any uncaught errors
 */
export async function ensureLocalCodinITrulesDirExists(cwd: string): Promise<boolean> {
	const CodinITrulePath = path.resolve(cwd, GlobalFileNames.CodinITRules)
	const defaultRuleFilename = "default-rules.md"

	try {
		const exists = await fileExistsAtPath(CodinITrulePath)

		if (exists && !(await isDirectory(CodinITrulePath))) {
			// logic to convert .CodinITrules file into directory, and rename the rules file to {defaultRuleFilename}
			const content = await fs.readFile(CodinITrulePath, "utf8")
			const tempPath = CodinITrulePath + ".bak"
			await fs.rename(CodinITrulePath, tempPath) // create backup
			try {
				await fs.mkdir(CodinITrulePath, { recursive: true })
				await fs.writeFile(path.join(CodinITrulePath, defaultRuleFilename), content, "utf8")
				await fs.unlink(tempPath).catch(() => {}) // delete backup

				return false // conversion successful with no errors
			} catch (conversionError) {
				// attempt to restore backup on conversion failure
				try {
					await fs.rm(CodinITrulePath, { recursive: true, force: true }).catch(() => {})
					await fs.rename(tempPath, CodinITrulePath) // restore backup
				} catch (restoreError) {}
				return true // in either case here we consider this an error
			}
		}
		// exists and is a dir or doesn't exist, either of these cases we dont need to handle here
		return false
	} catch (error) {
		return true
	}
}

export const getGlobalCodinITRules = async (globalCodinITRulesFilePath: string, toggles: CodinITRulesToggles) => {
	if (await fileExistsAtPath(globalCodinITRulesFilePath)) {
		if (await isDirectory(globalCodinITRulesFilePath)) {
			try {
				const rulesFilePaths = await readDirectory(globalCodinITRulesFilePath)
				const rulesFilesTotalContent = await getCodinITRulesFilesTotalContent(
					rulesFilePaths,
					globalCodinITRulesFilePath,
					toggles,
				)
				if (rulesFilesTotalContent) {
					const CodinITRulesFileInstructions = formatResponse.CodinITRulesGlobalDirectoryInstructions(
						globalCodinITRulesFilePath,
						rulesFilesTotalContent,
					)
					return CodinITRulesFileInstructions
				}
			} catch {
				console.error(`Failed to read .CodinITrules directory at ${globalCodinITRulesFilePath}`)
			}
		} else {
			console.error(`${globalCodinITRulesFilePath} is not a directory`)
			return undefined
		}
	}

	return undefined
}

export const getLocalCodinITRules = async (cwd: string, toggles: CodinITRulesToggles) => {
	const CodinITRulesFilePath = path.resolve(cwd, GlobalFileNames.CodinITRules)

	let CodinITRulesFileInstructions: string | undefined

	if (await fileExistsAtPath(CodinITRulesFilePath)) {
		if (await isDirectory(CodinITRulesFilePath)) {
			try {
				const rulesFilePaths = await readDirectory(CodinITRulesFilePath)
				const rulesFilesTotalContent = await getCodinITRulesFilesTotalContent(rulesFilePaths, cwd, toggles)
				if (rulesFilesTotalContent) {
					CodinITRulesFileInstructions = formatResponse.CodinITRulesLocalDirectoryInstructions(cwd, rulesFilesTotalContent)
				}
			} catch {
				console.error(`Failed to read .CodinITrules directory at ${CodinITRulesFilePath}`)
			}
		} else {
			try {
				if (CodinITRulesFilePath in toggles && toggles[CodinITRulesFilePath] !== false) {
					const ruleFileContent = (await fs.readFile(CodinITRulesFilePath, "utf8")).trim()
					if (ruleFileContent) {
						CodinITRulesFileInstructions = formatResponse.CodinITRulesLocalFileInstructions(cwd, ruleFileContent)
					}
				}
			} catch {
				console.error(`Failed to read .CodinITrules file at ${CodinITRulesFilePath}`)
			}
		}
	}

	return CodinITRulesFileInstructions
}

const getCodinITRulesFilesTotalContent = async (rulesFilePaths: string[], basePath: string, toggles: CodinITRulesToggles) => {
	const ruleFilesTotalContent = await Promise.all(
		rulesFilePaths.map(async (filePath) => {
			const ruleFilePath = path.resolve(basePath, filePath)
			const ruleFilePathRelative = path.relative(basePath, ruleFilePath)

			if (ruleFilePath in toggles && toggles[ruleFilePath] === false) {
				return null
			}

			return `${ruleFilePathRelative}\n` + (await fs.readFile(ruleFilePath, "utf8")).trim()
		}),
	).then((contents) => contents.filter(Boolean).join("\n\n"))
	return ruleFilesTotalContent
}

export async function synchronizeRuleToggles(
	rulesDirectoryPath: string,
	currentToggles: CodinITRulesToggles,
): Promise<CodinITRulesToggles> {
	// Create a copy of toggles to modify
	const updatedToggles = { ...currentToggles }

	try {
		const pathExists = await fileExistsAtPath(rulesDirectoryPath)

		if (pathExists) {
			const isDir = await isDirectory(rulesDirectoryPath)

			if (isDir) {
				// DIRECTORY CASE
				const filePaths = await readDirectory(rulesDirectoryPath)
				const existingRulePaths = new Set<string>()

				for (const filePath of filePaths) {
					const ruleFilePath = path.resolve(rulesDirectoryPath, filePath)
					existingRulePaths.add(ruleFilePath)

					const pathHasToggle = ruleFilePath in updatedToggles
					if (!pathHasToggle) {
						updatedToggles[ruleFilePath] = true
					}
				}

				// Clean up toggles for non-existent files
				for (const togglePath in updatedToggles) {
					const pathExists = existingRulePaths.has(togglePath)
					if (!pathExists) {
						delete updatedToggles[togglePath]
					}
				}
			} else {
				// FILE CASE
				// Add toggle for this file
				const pathHasToggle = rulesDirectoryPath in updatedToggles
				if (!pathHasToggle) {
					updatedToggles[rulesDirectoryPath] = true
				}

				// Remove toggles for any other paths
				for (const togglePath in updatedToggles) {
					if (togglePath !== rulesDirectoryPath) {
						delete updatedToggles[togglePath]
					}
				}
			}
		} else {
			// PATH DOESN'T EXIST CASE
			// Clear all toggles since the path doesn't exist
			for (const togglePath in updatedToggles) {
				delete updatedToggles[togglePath]
			}
		}
	} catch (error) {
		console.error(`Failed to synchronize rule toggles for path: ${rulesDirectoryPath}`, error)
	}

	return updatedToggles
}

export async function refreshCodinITRulesToggles(
	context: vscode.ExtensionContext,
	workingDirectory: string,
): Promise<{
	globalToggles: CodinITRulesToggles
	localToggles: CodinITRulesToggles
}> {
	// Global toggles
	const globalCodinITRulesToggles = ((await getGlobalState(context, "globalCodinITRulesToggles")) as CodinITRulesToggles) || {}
	const globalCodinITRulesFilePath = await ensureRulesDirectoryExists()
	const updatedGlobalToggles = await synchronizeRuleToggles(globalCodinITRulesFilePath, globalCodinITRulesToggles)
	await updateGlobalState(context, "globalCodinITRulesToggles", updatedGlobalToggles)

	// Local toggles
	const localCodinITRulesToggles = ((await getWorkspaceState(context, "localCodinITRulesToggles")) as CodinITRulesToggles) || {}
	const localCodinITRulesFilePath = path.resolve(workingDirectory, GlobalFileNames.CodinITRules)
	const updatedLocalToggles = await synchronizeRuleToggles(localCodinITRulesFilePath, localCodinITRulesToggles)
	await updateWorkspaceState(context, "localCodinITRulesToggles", updatedLocalToggles)

	return {
		globalToggles: updatedGlobalToggles,
		localToggles: updatedLocalToggles,
	}
}

export const createRuleFile = async (isGlobal: boolean, filename: string, cwd: string) => {
	try {
		let filePath: string
		if (isGlobal) {
			const globalCodinITRulesFilePath = await ensureRulesDirectoryExists()
			filePath = path.join(globalCodinITRulesFilePath, filename)
		} else {
			const localCodinITRulesFilePath = path.resolve(cwd, GlobalFileNames.CodinITRules)
			await fs.mkdir(localCodinITRulesFilePath, { recursive: true })
			filePath = path.join(localCodinITRulesFilePath, filename)
		}

		const fileExists = await fileExistsAtPath(filePath)

		if (fileExists) {
			return { filePath, fileExists }
		}

		await fs.writeFile(filePath, "", "utf8")

		return { filePath, fileExists: false }
	} catch (error) {
		return { filePath: null, fileExists: false }
	}
}

export async function deleteRuleFile(
	context: vscode.ExtensionContext,
	rulePath: string,
	isGlobal: boolean,
): Promise<{ success: boolean; message: string }> {
	try {
		// Check if file exists
		const fileExists = await fileExistsAtPath(rulePath)
		if (!fileExists) {
			return {
				success: false,
				message: `Rule file does not exist: ${rulePath}`,
			}
		}

		// Delete the file from disk
		await fs.unlink(rulePath)

		// Get the filename for messages
		const fileName = path.basename(rulePath)

		// Update the appropriate toggles
		if (isGlobal) {
			const toggles = ((await getGlobalState(context, "globalCodinITRulesToggles")) as CodinITRulesToggles) || {}
			delete toggles[rulePath]
			await updateGlobalState(context, "globalCodinITRulesToggles", toggles)
		} else {
			const toggles = ((await getWorkspaceState(context, "localCodinITRulesToggles")) as CodinITRulesToggles) || {}
			delete toggles[rulePath]
			await updateWorkspaceState(context, "localCodinITRulesToggles", toggles)
		}

		return {
			success: true,
			message: `Rule file "${fileName}" deleted successfully`,
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		console.error(`Error deleting rule file: ${errorMessage}`, error)
		return {
			success: false,
			message: `Failed to delete rule file.`,
		}
	}
}
