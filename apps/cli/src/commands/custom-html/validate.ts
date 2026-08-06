import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { formatFromPath, validateCustomHtml } from "@hostplan/core";
import { die, note, printJson, style } from "../../output";

export interface ValidateOptions {
	json?: boolean;
}

export async function validateCommand(file: string, options: ValidateOptions): Promise<void> {
	const path = resolve(file);
	const source = await readFile(path, "utf8").catch(() => die(`cannot read \`${file}\``));
	if (formatFromPath(path) !== "html") {
		if (options.json === true)
			printJson({ file: path, format: "md", valid: true, errors: [], warnings: [] });
		else note(style.dim("Markdown plans do not use the custom HTML validator."));
		return;
	}

	const result = validateCustomHtml(source);
	if (options.json === true) {
		printJson({ file: path, format: "html", ...result });
	} else {
		for (const warning of result.warnings) {
			note(`${style.yellow("warning")} ${warning.code}: ${warning.message}`);
		}
		for (const error of result.errors) {
			note(`${style.red("error")} ${error.code}: ${error.message}`);
		}
		if (result.valid) process.stdout.write(`${style.green("✓")} valid custom HTML\n`);
	}
	if (!result.valid) die("custom HTML validation failed");
}
