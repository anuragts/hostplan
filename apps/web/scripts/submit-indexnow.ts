import { PUBLIC_ROUTES, SITE_URL } from "../lib/site";

const key = "74bd004c41f144310fb8cad8cefb4191";
const keyLocation = `${SITE_URL}/${key}.txt`;
const urlList = [...PUBLIC_ROUTES.map((path) => `${SITE_URL}${path}`), `${SITE_URL}/llms.txt`];

const keyResponse = await fetch(keyLocation);
if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) {
	throw new Error(`IndexNow key is not deployed at ${keyLocation}`);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
	method: "POST",
	headers: { "Content-Type": "application/json; charset=utf-8" },
	body: JSON.stringify({
		host: new URL(SITE_URL).hostname,
		key,
		keyLocation,
		urlList,
	}),
});

if (!response.ok) {
	throw new Error(`IndexNow rejected the submission: ${response.status} ${await response.text()}`);
}

console.log(`Submitted ${urlList.length} canonical Hostplan URLs to IndexNow.`);
