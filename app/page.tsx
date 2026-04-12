import { checkAccessAction } from "./actions";

export default function Home() {
	return (
		<main>
			<h1>🔐 GitLab Access Checker</h1>
			<p className="description">
				Enter a top-level GitLab group ID to see who has access to its groups and projects.
			</p>
			<form action={checkAccessAction} className="form">
				<label htmlFor="groupId">Group ID:</label>
				<input
					id="groupId"
					name="groupId"
					type="text"
					required
					placeholder="e.g. 10975505"
					className="input"
				/>
				<label className="checkbox-label">
					<input type="checkbox" name="fresh" />
					Force fresh
				</label>
				<button type="submit" className="button submit-button">
					Check Access 🔍
				</button>
			</form>
			<p className="cache-notice">
				ℹ️ Data are cached for up to 1 hour. To refresh it, check the <strong>&quot;Force fresh&quot;</strong> checkbox before submitting the form.
			</p>
		</main>
	);
}
