import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "GitLab Access Checker",
	description: "Check who has access to your GitLab groups and projects",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
