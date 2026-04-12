export type Membership = {
	readonly path: string;
	readonly webUrl: string;
	readonly accessLevel: string;
	readonly kind: "group" | "project";
};

export type AggregatedUser = {
	readonly name: string;
	readonly username: string;
	readonly webUrl: string;
	readonly groups: ReadonlyArray<Membership>;
	readonly projects: ReadonlyArray<Membership>;
};


