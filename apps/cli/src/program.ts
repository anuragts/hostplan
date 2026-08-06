import { Command } from "commander";
import packageInfo from "../../../package.json" with { type: "json" };
import { addCommand } from "./commands/add";
import { loginCommand, logoutCommand, whoamiCommand } from "./commands/auth";
import { guideCommand, validateCommand } from "./commands/custom-html";
import { getCommand } from "./commands/get";
import { listCommand } from "./commands/list";
import { rmCommand } from "./commands/rm";
import { searchCommand } from "./commands/search";
import { serveCommand, serveStatusCommand, serveStopCommand } from "./commands/serve";
import { stackCommand } from "./commands/stack";
import { nextCommand, statusCommand } from "./commands/status";
import { checkCommand, tasksCommand } from "./commands/tasks";
import { themeCommand } from "./commands/theme";
import { updateCommand } from "./commands/update";
import { openCommand, urlCommand } from "./commands/url";
import { publishCommand, rotateCodeCommand, shareCommand } from "./commands/visibility";

const SCOPE_HELP = "defaults to the git repo and branch of the current directory";

export function buildProgram(): Command {
	const program = new Command();

	program
		.name("hsp")
		.description("hostplan — a central store for agent plans, with a local web viewer")
		.version(packageInfo.version)
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
		.option(
			"--after <ref>",
			"chain this plan after another — it stays blocked until that one is done",
		)
		.option("--status <status>", "starting status (draft, approved, in-progress, done, superseded)")
		.option("--theme <theme>", "document theme (run `hsp theme --list` to see choices)")
		.option("--open", "open the plan in a browser")
		.option("-q, --quiet", "print only the URL")
		.option("--json", "print the stored plan as JSON")
		.option("--local", "store locally without pushing to the deployment")
		.option("--no-serve", "do not start the viewer")
		.action(addCommand);

	program
		.command("guide")
		.argument("<topic>", "guide to print (custom-html)")
		.description("print a prompt-ready authoring guide")
		.option("--json", "print the guide as JSON")
		.action(guideCommand);

	program
		.command("validate")
		.argument("<file>", "plan file to validate")
		.description("validate a plan before storing it")
		.option("--json", "print structured diagnostics")
		.action(validateCommand);

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
		.command("status")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.argument("[status]", "draft, approved, in-progress, done, or superseded")
		.description("show or change where a plan is in its life")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(statusCommand);

	program
		.command("next")
		.description(`print the next actionable plan — not done, not blocked (${SCOPE_HELP})`)
		.option("-p, --project <name>", "only this project")
		.option("-b, --branch <name>", "only this branch")
		.option("-a, --all", "across every project")
		.option("--json", "print as JSON")
		.action(nextCommand);

	program
		.command("stack")
		.argument("[items...]", "plan files to chain in order, or one plan id to display")
		.description("split work into a chain of plans, each waiting on the one before")
		.option("--after <ref>", "hook the new chain onto an existing plan")
		.option("-p, --project <name>", `project bucket (${SCOPE_HELP})`)
		.option("-b, --branch <name>", `branch bucket (${SCOPE_HELP})`)
		.option("-a, --all", "when listing, every stack in the store")
		.option("--public", "anyone with the links can read them")
		.option("--theme <theme>", "document theme shared by every step")
		.option("--local", "store locally without pushing to the deployment")
		.option("--no-serve", "do not start the viewer")
		.option("--json", "print as JSON")
		.action(stackCommand);

	program
		.command("update")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.argument("[file]", "file with the revised plan")
		.description("revise a plan's body — same id and link, previous revision kept")
		.option("-c, --content <text>", "revised body, instead of a file")
		.option("-t, --title <title>", "also change the title")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(updateCommand);

	program
		.command("theme")
		.argument("[ref]", "plan id, plan URL, or `latest`")
		.argument("[theme]", "new document theme")
		.description("show or change a plan's document theme")
		.option("--list", "list the built-in themes")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(themeCommand);

	program
		.command("search")
		.argument("<query...>", "terms to look for")
		.description("full-text search across every stored plan")
		.option("-p, --project <name>", "only this project")
		.option("-b, --branch <name>", "only this branch")
		.option("-n, --limit <count>", "show at most this many (default 20)")
		.option("--json", "print as JSON")
		.action(searchCommand);

	program
		.command("tasks")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.description("list a plan's checkboxes as numbered tasks")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(tasksCommand);

	program
		.command("check")
		.argument("<ref>", "plan id, plan URL, or `latest`")
		.argument("<tasks...>", "task numbers from `hsp tasks`")
		.description("tick tasks off in the stored plan")
		.option("--undo", "untick instead")
		.option("-p, --project <name>", "scope for `latest`")
		.option("-b, --branch <name>", "scope for `latest`")
		.option("-a, --all", "resolve `latest` across every project")
		.option("--json", "print as JSON")
		.action(checkCommand);

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
		.option("--token <token>", "access token — the unattended path, for agents and CI")
		.option("--no-browser", "paste a token instead of approving in a browser")
		.option("--no-open", "print the approval link instead of opening it")
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
