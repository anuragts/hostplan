import { type CustomHtmlValidation, validateCustomHtml } from "@hostplan/core";
import { die, warn } from "../../output";

export function validationMessage(result: CustomHtmlValidation): string {
	return result.errors.map((issue) => `${issue.code}: ${issue.message}`).join("\n");
}

export function assertValidCustomHtml(source: string): CustomHtmlValidation {
	const result = validateCustomHtml(source);
	if (!result.valid) die(`invalid custom HTML\n${validationMessage(result)}`);
	for (const issue of result.warnings) warn(`${issue.code}: ${issue.message}`);
	return result;
}
