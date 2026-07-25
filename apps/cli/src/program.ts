import { Command } from "commander";
import { addCommand } from "./commands/add";
import { loginCommand, logoutCommand, whoamiCommand } from "./commands/auth";
import { getCommand } from "./commands/get";
import { listCommand } from "./commands/list";
import { rmCommand } from "./commands/rm";
import { serveCommand, serveStatusCommand, serveStopCommand } from "./commands/serve";
import { openCommand, urlCommand } from "./commands/url";
import { publishCommand, rotateCodeCommand, shareCommand } from "./commands/visibility";

const SCOPE_HELP = "defaults to the git repo and branch of the current directory";

export function buildProgram(): Command {
	const program = new Command();

	program
		.name("hsp")
		.description("hostplan — a central store for agent plans, with a local web viewer")
		.version("0.1.0")
		.showHelpAfterError();

	program
		.command("add", { isDefault: false })
		.argument("[file]", "path to a markdown or html plan")
		.description("store a plan and print its URL")
		.option("-c, --content <text>", "plan body, instead of a file")
		.option("-t, --title <title>", "override the derived title")
		.option("-p, --project <name>", `project bucket (${SCOPE_HELP})`)
		.option("-b, --branch <name>", `branch bucket (${SCOPE_HELP})`)
		.option("-f, --format <format>", "md or html; inferred from the file extension")
		.option("--public", "anyone with the link can read it")
		.option("--private", "readable only with the 4-letter code (default)")
		.option("--open", "open the plan in a browser")
		.option("-q, --quiet", "print only the URL")
		.option("--json", "print the stored plan as JSON")
		.option("--local", "store locally without pushing to the deployment")
		.option("--no-serve", "do not start the viewer")
		.action(addCommand);

	program
		.command("get")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("print a stored plan to stdout")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--meta", "print metadata instead of the body")
		.option("--json", "print the plan and its metadata as JSON")
		.action(getCommand);

	program
		.command("list")
		.alias("ls")
		.description(`list stored plans (${SCOPE_HELP})`)
		.option("-p, --project <name>", "only this project, across all its branches")
		.option("-b, --branch <name>", "only this branch")
		.option("-a, --all", "every plan in the store")
		.option("-n, --limit <count>", "show at most this many")
		.option("--json", "print as JSON")
		.action(listCommand);

	program
		.command("url")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("print the URL for a plan")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--no-serve", "do not start the viewer")
		.action(urlCommand);

	program
		.command("open")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("open a plan in the browser")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.action(openCommand);

	program
		.command("rm")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("delete a stored plan")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(rmCommand);

	program
		.command("share")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("print the shareable links for a plan")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(shareCommand);

	program
		.command("publish")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("make a plan readable by anyone with the link")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(publishCommand(true));

	program
		.command("unpublish")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("make a plan private again, with a fresh code")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(publishCommand(false));

	program
		.command("rotate")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("issue a new share code, invalidating the old link")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(rotateCodeCommand);

	program
		.command("login")
		.description("sign in to a hostplan deployment so `add` pushes to it")
		.option("--url <url>", "deployment base url")
		.option("--token <token>", "owner token; prompted for if omitted")
		.option("--json", "print as JSON")
		.action(loginCommand);

	program
		.command("logout")
		.description("forget the saved deployment and token")
		.option("--json", "print as JSON")
		.action(logoutCommand);

	program
		.command("whoami")
		.description("print the deployment plans are pushed to")
		.option("--json", "print as JSON")
		.action(whoamiCommand);

	const serve = program
		.command("serve")
		.description("start the viewer (runs in the background by default)")
		.option("--port <port>", "port to serve on; saved to the config")
		.option("--foreground", "run in the foreground")
		.option("--json", "print as JSON")
		.action(serveCommand);

	serve
		.command("status")
		.description("check whether the viewer is running")
		.option("--json", "print as JSON")
		.action(serveStatusCommand);

	serve
		.command("stop")
		.description("stop the background viewer")
		.option("--json", "print as JSON")
		.action(serveStopCommand);

	return program;
}
