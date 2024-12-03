'use client';

import { useAuth } from '@/context/AuthContext';

export default function Home() {
	const { userID, username, token, initData, error } = useAuth();

	return (
		<main className="flex flex-col items-center justify-center min-h-screen text-center space-y-4">
			<h1 className="text-4xl font-bold">
				Welcome to Secure Telegram Web App!
			</h1>
			<p>User ID: {userID || 'Not available'}</p>
			<p>Username: {username || 'Not available'}</p>
			<p>Token: {token || 'Not available'}</p>
			<p>InitData: {initData || 'Not available'}</p>
			{error && <p>Error: {error}</p>}
		</main>
	);
}
