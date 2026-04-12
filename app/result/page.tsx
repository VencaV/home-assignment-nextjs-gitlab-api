import { revalidateAction } from "@/app/actions";
import { getAccessData } from "@/lib/get-access-data";
import { AggregatedUser, Membership } from "@/types/domain-types";
import Link from "next/link";
import React, { Suspense } from "react";

type SearchParams = Promise<{ groupId?: string }>;

const formatMemberships = (
	memberships: ReadonlyArray<Membership>,
): React.ReactNode => {
	if (memberships.length === 0) {
		return '-';
	}
	return memberships.map((m, index) => (
		<span key={m.path}>
			<a href={m.webUrl} target="_blank" rel="noopener noreferrer">
				{m.path}
			</a>
			<em>{` (${m.accessLevel})`}</em>
			{index < memberships.length - 1 ? ", " : ""}
		</span>
	));
};

const UserReportEntry = ({ user }: { user: AggregatedUser }) => {
	return (
		<li>
			<a href={user.webUrl} target="_blank" rel="noopener noreferrer">
				{user.name} (@{user.username})
			</a>
			<div>Groups: {formatMemberships(user.groups)}</div>
			<div>Projects: {formatMemberships(user.projects)}</div>
		</li>
	);
};

async function AccessReport({ searchParams }: { searchParams: SearchParams }) {
	const { groupId: rawGroupId } = await searchParams;

	if (!rawGroupId || !/^\d+$/.test(rawGroupId)) {
		return (
			<>
				<h1>Error</h1>
				<p>
					Invalid or missing group ID. <Link href="/">Go back</Link>
				</p>
			</>
		);
	}

	const groupId = Number(rawGroupId);

	let data: { users: ReadonlyArray<AggregatedUser> };
	try {
		data = await getAccessData(groupId);
	} catch (error) {
		return (
			<>
				<h1>Error</h1>
				<p>{error instanceof Error ? error.message : "Unknown error"}</p>
				<p>
					<Link href="/">Go back</Link>
				</p>
			</>
		);
	}

	const users = data.users;

	return (
		<>
			<h1>🔐 Access Report for Group {groupId}</h1>
			<p>
				<Link href="/" className="button">
					New check 🔁
				</Link>
			</p>
			<div className="cache-notice p">
				ℹ️ Data may be cached (<em>up to 1 hour</em>). To get fresh data, use
				the <strong>&quot;Force fresh&quot;</strong> checkbox before submitting
				the form or{" "}
				<form action={revalidateAction} className="inline-form">
					<input type="hidden" name="groupId" value={groupId} />
					<button type="submit" className="link-button">
						click here
					</button>
				</form>
				.
			</div>
			<ul className="access-report">
				{users.map((user) => (
					<UserReportEntry key={user.username} user={user} />
				))}
				<li>
					Users in total: <strong>{users.length}</strong>
				</li>
			</ul>
		</>
	);
}

export default function ResultPage({
	searchParams,
}: {
	searchParams: SearchParams;
}) {
	return (
		<main>
			<Suspense fallback={<p>Loading access data...</p>}>
				<AccessReport searchParams={searchParams} />
			</Suspense>
		</main>
	);
}
