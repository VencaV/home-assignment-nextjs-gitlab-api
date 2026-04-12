import { Membership } from "./domain-types";

export type UserRecord = {
	name: string;
	username: string;
	webUrl: string;
	groups: Membership[];
	projects: Membership[];
};

export type UserMap = Map<number, UserRecord>;
