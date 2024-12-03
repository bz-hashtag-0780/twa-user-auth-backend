'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface CustomJwtPayload extends JwtPayload {
	id: string;
	username: string;
}

type AuthContextType = {
	userID: string | null;
	username: string | null;
	token: string | null;
	initData: string | null;
	error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [userID, setUserID] = useState<string | null>(null);
	const [username, setUsername] = useState<string | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [initData, setInitData] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const isTokenValid = (token: string): boolean => {
		const { exp } = jwtDecode<JwtPayload>(token);
		return exp !== undefined && exp * 1000 > Date.now();
	};

	useEffect(() => {
		async function authenticateUser() {
			if (typeof window !== 'undefined' && WebApp) {
				const initData = WebApp.initData;

				try {
					const response = await axios.post(
						`${process.env.NEXT_PUBLIC_API_URL}/auth`,
						{ initData }
					);

					const { id, username } = jwtDecode<CustomJwtPayload>(
						response.data.token
					);
					setInitData(initData);
					setToken(response.data.token);
					setUserID(id);
					setUsername(username);
				} catch (error) {
					setError('Authentication failed');
					console.error('Authentication failed:', error);
					setInitData(initData);
					setToken(null);
					setUserID(null);
					setUsername(null);
				}
			}
		}

		// Check the token if it already exists
		if (token) {
			if (!isTokenValid(token)) {
				console.warn('Token expired. Clearing user state.');
				setToken(null);
				setUserID(null);
				setUsername(null);
			}
		} else {
			authenticateUser();
		}
	}, [token]);

	return (
		<AuthContext.Provider
			value={{ userID, username, token, initData, error }}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthContextProvider');
	}
	return context;
};
