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

	useEffect(() => {
		async function authenticateUser() {
			if (typeof window !== 'undefined' && WebApp) {
				const initData = WebApp.initData;

				try {
					const response = await axios.post(
						'http://localhost:5000/auth',
						{
							initData,
						}
					);

					const { id, username } = jwtDecode<CustomJwtPayload>(
						response.data.token
					);
					setToken(response.data.token);
					setUserID(id);
					setUsername(username);
				} catch (error) {
					console.error('Authentication failed:', error);
				}
			}
		}

		authenticateUser();
	}, []);

	return (
		<AuthContext.Provider value={{ userID, username, token }}>
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
