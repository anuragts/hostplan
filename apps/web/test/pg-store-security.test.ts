import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { pgPlanStore } from "../lib/pg-store";

describe("account plan store isolation", () => {
	test("adds user_id constraints even when the client bypasses RLS", async () => {
		const queries: Array<Array<[string, unknown]>> = [];
		type Query = Promise<{ data: never[]; error: null }> & {
			select: () => Query;
			eq: (column: string, value: unknown) => Query;
			order: () => Query;
			maybeSingle: () => Promise<{ data: null; error: null }>;
		};
		const db = {
			from: () => {
				const filters: Array<[string, unknown]> = [];
				queries.push(filters);
				const query = Promise.resolve({ data: [], error: null }) as Query;
				query.select = () => query;
				query.eq = (column: string, value: unknown) => {
					filters.push([column, value]);
					return query;
				};
				query.order = () => query;
				query.maybeSingle = async () => ({ data: null, error: null });
				return query;
			},
		} as unknown as SupabaseClient;

		const store = pgPlanStore(db, "user-a");
		await store.getMeta?.("a3f9c2");
		await store.list();

		expect(queries[0]).toContainEqual(["user_id", "user-a"]);
		expect(queries[1]).toContainEqual(["user_id", "user-a"]);
	});

	test("does not touch storage when a duplicate database id is rejected", async () => {
		let uploads = 0;
		const query = {
			insert() {
				return query;
			},
			select() {
				return query;
			},
			async single() {
				return { data: null, error: { message: "duplicate key" } };
			},
		};
		const db = {
			from: () => query,
			storage: {
				from: () => ({
					upload: async () => {
						uploads++;
						return { error: null };
					},
				}),
			},
		} as unknown as SupabaseClient;

		await expect(
			pgPlanStore(db, "user-a").add({
				id: "a3f9c2",
				content: "# replacement",
				title: "Replacement",
				project: "hostplan",
				branch: "main",
				format: "md",
			}),
		).rejects.toThrow("insert failed: duplicate key");
		expect(uploads).toBe(0);
	});
});
