const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');
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

// Function to validate Telegram `initData`
const isValidTelegramInitData = (initData) => {
	try {
		const decodedInitData = decodeURIComponent(initData);
		const urlSearchParams = new URLSearchParams(decodedInitData);
		const params = Object.fromEntries(urlSearchParams.entries());

		// Ensure the required fields are present
		if (!params.hash) return false;

		const hash = params.hash;
		delete params.hash;

		const secretKey = crypto
			.createHash('sha256')
			.update(BOT_TOKEN)
			.digest();
		const dataCheckString = Object.keys(params)
			.sort()
			.map((key) => `${key}=${params[key]}`)
			.join('\n');
		const computedHash = crypto
			.createHmac('sha256', secretKey)
			.update(dataCheckString)
			.digest('hex');

		return computedHash === hash;
	} catch (error) {
		console.error('Error decoding initData:', error.message);
		return false;
	}
};

// Endpoint to authenticate Telegram users
app.post('/auth', (req, res) => {
	const { initData } = req.body;

	if (!initData) {
		return res.status(400).json({ error: 'initData is required' });
	}

	// Validate initData
	if (!isValidTelegramInitData(initData)) {
		return res.status(400).json({ error: 'Invalid Telegram data' });
	}

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
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
