const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { validate, isErrorOfType } = require('@telegram-apps/init-data-node');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(
	cors({
		origin: process.env.FRONTEND_URL || 'http://localhost:3001', // Replace with your production frontend URL
		methods: ['POST'],
	})
);

app.use(bodyParser.json());

// Endpoint to authenticate Telegram users
app.post('/auth', (req, res) => {
	const { initData } = req.body;

	if (!initData) {
		return res.status(400).json({ error: 'initData is required' });
	}

	try {
		// Validate initData
		validate(initData, BOT_TOKEN);

		// Decode initData and extract parameters
		const decodedInitData = decodeURIComponent(initData);
		const urlSearchParams = new URLSearchParams(decodedInitData);
		const params = Object.fromEntries(urlSearchParams.entries());

		// Parse the `user` field if available
		let user = {};
		if (params.user) {
			try {
				user = JSON.parse(params.user);
			} catch (error) {
				return res
					.status(400)
					.json({ error: 'Invalid user data format in initData' });
			}
		}

		// Generate a JWT token
		const token = jwt.sign(
			{ id: user.id, username: user.username },
			JWT_SECRET,
			{ expiresIn: '1h' }
		);

		res.json({ message: 'Authenticated', token });
	} catch (error) {
		// Handle validation errors
		if (isErrorOfType(error, 'ERR_SIGN_INVALID')) {
			return res.status(400).json({ error: 'Invalid signature!' });
		} else if (isErrorOfType(error, 'ERR_AUTH_DATE_INVALID')) {
			return res
				.status(400)
				.json({ error: 'auth_date is missing or invalid!' });
		} else if (isErrorOfType(error, 'ERR_EXPIRED')) {
			return res.status(400).json({ error: 'initData has expired!' });
		} else {
			console.error('Unknown validation error:', error.message);
			return res.status(500).json({ error: 'Internal server error' });
		}
	}
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
