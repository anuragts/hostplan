import { CliError, note, style } from "./output";
import { buildProgram } from "./program";

export async function runCli(argv: string[]): Promise<void> {
	try {
		await buildProgram().parseAsync(argv);
	} catch (error) {
		if (error instanceof CliError) {
			note(`${style.red("✗")} ${error.message}`);
			process.exitCode = 1;
			return;
		}
		throw error;
	}
}
