import {
	CUSTOM_HTML_COMPONENTS,
	CUSTOM_HTML_INSTRUCTIONS,
	CUSTOM_HTML_PROFILE_VERSION,
	CUSTOM_HTML_SKELETON,
	CUSTOM_HTML_TOKENS,
} from "@hostplan/core";
import { die, printJson } from "../../output";

export interface GuideOptions {
	json?: boolean;
}

export function guideCommand(topic: string, options: GuideOptions): void {
	if (topic !== "custom-html") die("the available guide is `custom-html`");
	if (options.json === true) {
		printJson({
			id: "custom-html",
			version: CUSTOM_HTML_PROFILE_VERSION,
			instructions: CUSTOM_HTML_INSTRUCTIONS,
			tokens: CUSTOM_HTML_TOKENS,
			components: CUSTOM_HTML_COMPONENTS,
			skeleton: CUSTOM_HTML_SKELETON,
		});
		return;
	}
	process.stdout.write(`${CUSTOM_HTML_INSTRUCTIONS}\n`);
}
