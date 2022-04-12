require('@lavaclient/queue/register');
require('dotenv').config();
const { Client, Intents, Collection, MessageEmbed } = require('discord.js');
const { Node } = require('lavaclient');
const { load } = require('@lavaclient/spotify');
const { token, lavalink, spotify, defaultColor, defaultLocale, functions } = require('./settings.json');
const fs = require('fs');
const fsPromises = require('fs').promises;
const { msToTime, msToTimeString, getLocale } = require('./functions.js');
const readline = require('readline');
const { logger, guildData } = require('./shared.js');

// Start an http server if process is running in a replit environment.
const { startHttpServer } = require('./httpServer.js');
if (process.env.REPLIT_DB_URL !== undefined) {
	logger.info({ message: 'Replit environment detected. Starting http server.', label: 'Quaver' });
	startHttpServer();
}

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
rl.on('line', line => {
	switch (line.split(' ')[0].toLowerCase()) {
		case 'exit':
			shuttingDown('exit');
			break;
		case 'sessions':
			if (!module.exports.startup) {
				console.log('Quaver is not initialized yet.');
				break;
			}
			console.log(`There are currently ${bot.music.players.size} active session(s).`);
			break;
		case 'stats': {
			const uptime = msToTime(bot.uptime);
			const uptimeString = msToTimeString(uptime);
			console.log(`Statistics:\nGuilds: ${bot.guilds.cache.size}\nUptime: ${uptimeString}`);
			break;
		}
		case 'whitelist': {
			if (!module.exports.startup) {
				console.log('Quaver is not initialized yet.');
				break;
			}
			const guildId = line.split(' ')[1];
			if (!functions['247'].whitelist) {
				console.log('The 24/7 whitelist is not enabled.');
				break;
			}
			const guild = bot.guilds.cache.get(guildId);
			if (!guild) {
				console.log('Guild not found.');
				break;
			}
			if (!guildData.get(`${guildId}.247.whitelisted`)) {
				console.log(`Added ${guild.name} to the 24/7 whitelist.`);
				guildData.set(`${guildId}.247.whitelisted`, true);
			}
			else {
				console.log(`Removed ${guild.name} from the 24/7 whitelist.`);
				guildData.set(`${guildId}.247.whitelisted`, false);
			}
			break;
		}
		default:
			console.log('Available commands: exit, sessions, whitelist, stats');
			break;
	}
});
// 'close' event catches ctrl+c, therefore we pass it to shuttingDown as a ctrl+c event
rl.on('close', () => shuttingDown('SIGINT'));

load({
	client: {
		id: process.env.SPOTIFY_CLIENT_ID ? process.env.SPOTIFY_CLIENT_ID : spotify.client_id,
		secret: process.env.SPOTIFY_CLIENT_SECRET ? process.env.SPOTIFY_CLIENT_SECRET : spotify.client_secret,
	},
	autoResolveYoutubeTracks: !!process.env.SPOTIFY_AUTO_RESOLVE_YT,
});

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });
bot.commands = new Collection();
bot.music = new Node({
	connection: {
		host: process.env.LAVA_HOST ? process.env.LAVA_HOST : lavalink.host,
		port: process.env.LAVA_PORT ? process.env.LAVA_PORT : lavalink.port,
		password: process.env.LAVA_PASS ? process.env.LAVA_PASS : lavalink.password,
		secure: process.env.LAVA_SECURE ? !!process.env.LAVA_SECURE : !!lavalink.secure,
		reconnect: {
			delay: process.env.LAVA_RECONNECT_DELAY ? process.env.LAVA_RECONNECT_DELAY ?? 3000 : lavalink.reconnect.delay ?? 3000,
			tries: process.env.LAVA_RECONNECT_TRIES ? process.env.LAVA_RECONNECT_TRIES ?? 5 : lavalink.reconnect.tries ?? 5,
		},
	},
	sendGatewayPayload: (id, payload) => bot.guilds.cache.get(id)?.shard?.send(payload),
});
bot.ws.on('VOICE_SERVER_UPDATE', data => bot.music.handleVoiceUpdate(data));
bot.ws.on('VOICE_STATE_UPDATE', data => bot.music.handleVoiceUpdate(data));
module.exports.bot = bot;

let inProgress = false;
async function shuttingDown(eventType, err) {
	if (inProgress) return;
	inProgress = true;
	logger.info({ message: 'Shutting down...', label: 'Quaver' });
	if (module.exports.startup) {
		logger.info({ message: 'Disconnecting from all guilds...', label: 'Quaver' });
		for (const pair of bot.music.players) {
			const player = pair[1];
			logger.info({ message: `[G ${player.guildId}] Disconnecting (restarting)`, label: 'Quaver' });
			const fileBuffer = [];
			if (player.queue.current && (player.playing || player.paused)) {
				fileBuffer.push(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'CURRENT')}:`);
				fileBuffer.push(player.queue.current.uri);
			}
			if (player.queue.tracks.length > 0) {
				fileBuffer.push(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'QUEUE')}:`);
				fileBuffer.push(player.queue.tracks.map(track => track.uri).join('\n'));
			}
			player.musicHandler.disconnect();
			const botChannelPerms = bot.guilds.cache.get(player.guildId).channels.cache.get(player.queue.channel.id).permissionsFor(bot.user.id);
			if (!botChannelPerms.has(['VIEW_CHANNEL', 'SEND_MESSAGES'])) { continue; }
			await player.queue.channel.send({
				embeds: [
					new MessageEmbed()
						.setDescription(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, ['exit', 'SIGINT', 'SIGTERM', 'lavalink'].includes(eventType) ? 'MUSIC_RESTART' : 'MUSIC_RESTART_CRASH')}${fileBuffer.length > 0 ? `\n${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_RESTART_QUEUEDATA')}` : ''}`)
						.setFooter({ text: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_RESTART_SORRY') })
						.setColor(defaultColor),
				],
				files: fileBuffer.length > 0 ? [
					{
						attachment: Buffer.from(fileBuffer.join('\n')),
						name: 'queue.txt',
					},
				] : [],
			});
		}
	}
	if (!['exit', 'SIGINT', 'SIGTERM'].includes(eventType)) {
		logger.error({ message: `${err.message}\n${err.stack}`, label: 'Quaver' });
		logger.info({ message: 'Logging additional output to error.log.', label: 'Quaver' });
		try {
			await fsPromises.writeFile('error.log', `${eventType}${err.message ? `\n${err.message}` : ''}${err.stack ? `\n${err.stack}` : ''}`);
		}
		catch (e) {
			logger.error({ message: 'Encountered error while writing to error.log.', label: 'Quaver' });
			logger.error({ message: `${e.message}\n${e.stack}`, label: 'Quaver' });
		}
	}
	bot.destroy();
	process.exit();
}
module.exports.shuttingDown = shuttingDown;

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	bot.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		bot.once(event.name, (...args) => event.execute(...args));
	}
	else {
		bot.on(event.name, (...args) => event.execute(...args));
	}
}

const musicEventFiles = fs.readdirSync('./events/music').filter(file => file.endsWith('.js'));
for (const file of musicEventFiles) {
	const event = require(`./events/music/${file}`);
	if (event.once) {
		bot.music.once(event.name, (...args) => event.execute(...args));
	}
	else {
		bot.music.on(event.name, (...args) => event.execute(...args));
	}
}

bot.login(process.env.BOT_TOKEN ? process.env.BOT_TOKEN : token);

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM', 'uncaughtException', 'unhandledRejection'].forEach(eventType => {
	process.on(eventType, err => shuttingDown(eventType, err));
});

module.exports.startup = false;
module.exports.updateStartup = () => {
	module.exports.startup = true;
};
