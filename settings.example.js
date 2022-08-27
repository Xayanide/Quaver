// import 'dotenv/config';
import { Colors } from 'discord.js';

// The Discord token for your bot. Get it from https://discord.com/developers/applications.
export const token = process.env.BOT_TOKEN || 'Paste token here';
// The Discord application ID for your bot. Usually the same as your bot's user ID. You can also get this from https://discord.com/developers/applications.
export const applicationId = process.env.BOT_APP_ID || 'Paste application ID here';
// The Discord client secret for your bot. Found in OAuth2 > General at https://discordapp.com/developers/applications.
export const clientSecret = process.env.BOT_CLIENT_SECRET || 'Paste client secret here';
// A ColorResolvable (https://discord.js.org/#/docs/discord.js/main/typedef/ColorResolvable) color.
export const colors = {
	success: Colors.DarkGreen,
	neutral: '#f39bff',
	warning: Colors.Orange,
	error: Colors.DarkRed,
};
// Any locale from the locales folder. Quaver will not start if an invalid locale is selected.
// This locale is also used for all logs, slash command descriptions (at time of deployment), and for all guilds that don't specify a locale.
// If changing default locale, re-deploy commands for it to take effect in slash command descriptions.
export const defaultLocale = 'en';
// An array of user IDs that are given manager-level permission on Quaver. Doesn't do much for now.
export const managers = [
	'Paste your user ID here',
];
// The database to use.
export const database = {
	// The protocol. For example, sqlite would use sqlite://.
	protocol: 'sqlite',
	// The path relative to the base directory. For example, database.sqlite would use the database.sqlite file.
	path: 'database.sqlite',
};
// Lavalink settings.
export const lavalink = {
	// The host IP of the Lavalink instance.
	host: process.env.LAVA_HOST || 'localhost',
	// The port that Lavalink is listening on. (Defined in application.yml as server.port)
	port: process.env.LAVA_PORT || 12345,
	// The password configured for the Lavalink instance. (Defined in application.yml as server.password)
	password: process.env.LAVA_PASS || 'youshallnotpass',
	// Whether or not the Lavalink instance is secure. Defaults to false if unspecified.
	secure: !!process.env.LAVA_SECURE || false,
	reconnect: {
		// The delay between reconnect attempts in milliseconds. Defaults to 3000 if unspecified.
		delay: process.env.LAVA_RECONNECT_DELAY || 3000,
		// The number of reconnect attempts before giving up. Defaults to 5 if unspecified.
		tries: process.env.LAVA_RECONNECT_TRIES || 5,
	},
};
// Configurable features.
export const features = {
	// 24/7 feature
	// Allows users to make Quaver stay in their voice channel regardless of activity.
	stay: {
		// Whether or not the feature is enabled.
		enabled: true,
		// Whether or not the feature requires guilds to be whitelisted.
		whitelist: false,
	},
	// Spotify feature
	// Allows users to use Spotify URIs to play music.
	spotify: {
		// Whether or not the feature is enabled.
		enabled: true,
		// Spotify API Client ID, obtainable at https://developer.spotify.com/dashboard/applications.
		client_id: process.env.SPOTIFY_CLIENT_ID || 'Paste Spotify Client ID here',
		// Spotify API Client Secret, obtainable at https://developer.spotify.com/dashboard/applications.
		client_secret: process.env.SPOTIFY_CLIENT_SECRET || 'Paste Spotify Client Secret here',
	},
	// Web feature
	// Enables Quaver to handle WebSocket connections, used in conjunction with Quaver-Web.
	web: {
		// Whether or not the feature is enabled.
		enabled: false,
		// The WebSocket port to use. Has to be the same in Quaver-Web's configuration.
		port: process.env.WEB_PORT || 3000,
		// Allowed origins for incoming WebSocket connections.
		allowedOrigins: [
			'http://localhost',
		],
		// Encryption key for securing access tokens.
		encryptionKey: process.env.WEB_ENCRYPT_KEY || 'Type an encryption key here',
		// Key and cert files for HTTPS (remove this property if you do not need HTTPS).
		https: {
			enabled: false,
			key: 'key.pem',
			cert: 'cert.pem',
		},
	},
};
