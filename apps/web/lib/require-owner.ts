import { redirect } from "next/navigation";
import { currentViewer } from "@/lib/current-viewer";
import { canBrowse, type Viewer } from "@/lib/viewer";

/** Guards a page that lists plans. Returns the viewer so callers can scope to it. */
export async function requireOwner(next = "/"): Promise<Viewer> {
	const viewer = await currentViewer();
	if (!canBrowse(viewer)) redirect(`/login?next=${encodeURIComponent(next)}`);
	return viewer;
}
