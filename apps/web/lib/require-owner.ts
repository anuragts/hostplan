import { redirect } from "next/navigation";
import { isOwnerSession } from "./auth";

/**
 * Gate for the index pages, which list every plan regardless of visibility.
 *
 * Middleware already bounces requests with no cookie, but it only checks that
 * one is *present* — it can't verify the HMAC without the owner token. This is
 * where a forged cookie is actually rejected.
 */
export async function requireOwner(): Promise<void> {
	if (await isOwnerSession()) return;
	redirect("/login");
}
