import type { PlanMeta } from "./meta";
import type { AddPlanInput, PlanFilter, StoredPlan, UpdatePlanPatch } from "./store";
import { addPlan, getPlan, listPlans, removePlan, updatePlan } from "./store";

/**
 * The seam between "plans are files in ~/.hostplan" and "plans are objects in a
 * bucket". The CLI and the local viewer use the filesystem implementation; a
 * deployment swaps in one backed by object storage. Keys and metadata are
 * identical either way, so a store can be moved by copying files.
 */
export interface PlanStore {
	add(input: AddPlanInput): Promise<StoredPlan>;
	get(id: string): Promise<StoredPlan | undefined>;
	/**
	 * Metadata alone, for callers that only need a status or a title. Optional
	 * because it is only worth implementing where the body costs something extra
	 * to fetch — on a bucket-backed store that is a whole network round trip.
	 * Callers fall back to `get`.
	 */
	getMeta?(id: string): Promise<PlanMeta | undefined>;
	list(filter?: PlanFilter): Promise<StoredPlan[]>;
	update(id: string, patch: UpdatePlanPatch): Promise<StoredPlan | undefined>;
	remove(id: string): Promise<StoredPlan | undefined>;
}

/** The original behaviour: a directory tree under `~/.hostplan`. */
export const fsPlanStore: PlanStore = {
	add: addPlan,
	get: getPlan,
	list: (filter) => listPlans(filter),
	update: updatePlan,
	remove: removePlan,
};
