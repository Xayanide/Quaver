const { Permissions } = require('discord.js');
const { logger, guildData } = require('../shared.js');
const { getLocale } = require('../functions.js');
const { bot } = require('../main.js');
const { defaultLocale } = require('../settings.json');

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	/**
	 *
	 * voiceStateUpdate
	 * @param {*} oldState - Defined when someone leaves, null when someone joins
	 * @param {*} newState - Defined when someone joins, null when someone leaves
	 * @description - Both of them becomes defined when someone moves from one channel to another, or changes their state
	 * @returns {*} - State
	 *
	 */
	async execute(oldState, newState) {
		const guild = oldState.guild;
		const player = bot.music.players.get(guild.id);

		/**
		 *
		 * WARNING:
		 *
		 * Repetitive code ahead
		 * https://www.youtube.com/watch?v=UnIhRpIT7nc
		 *
		 * I do not guarantee that this is good code
		 *
		 */

		// No player, ignore all events
		if (!player) return console.log('No player, ignored every event');

		// Leave event
		if (oldState.channelId && newState.channelId === null) {
			// Bot leave
			if (oldState.member.user.id === bot.user.id) {
				// Bot state change
				if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && oldState.channelId === newState.channelId) return console.log('Leave: Bot state change');
				// Bot leave voice
				if (oldState.channel?.type === 'GUILD_VOICE') {
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					await player.musicHandler.disconnect();
					await player.musicHandler.locale('MUSIC_FORCED');
					return console.log('Leave: Voice, bot leave');
				}
				// Channel was a stage channel, and bot was unsuppressed
				if (oldState.channel?.type === 'GUILD_STAGE_VOICE' && !oldState.suppress) {
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					await player.musicHandler.disconnect();
					await player.musicHandler.locale('MUSIC_FORCED');
					// check for connect, speak permission for voice channel
					const permissions = bot.guilds.cache.get(guild.id).channels?.cache.get(oldState.channelId).permissionsFor(bot.user.id);
					if (!permissions.has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_BASIC');
						return;
					}
					if (!permissions.has(Permissions.STAGE_MODERATOR)) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_STAGE');
						return;
					}
					if (oldState.channel.stageInstance?.topic === getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_STAGE_TOPIC')) {
						try {
							await oldState.channel.stageInstance.delete();
						}
						catch (err) {
							logger.error({ message: `${err.message}\n${err.stack}`, label: 'Quaver' });
						}
					}
					return console.log('Leave: Stage, bot leave');
				}
				return console.log('Leave: Bot leave');
			}
			// Human leave
			if (!oldState.member.user.bot) {
				// Human state change
				if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && oldState.channelId === newState.channelId) return console.log('Leave: Human state change');
				// Bot was not in the same channel
				if (!oldState.channel.members.has(bot.user.id)) return;
				// Avoid pauseTimeout if 24/7 is enabled
				if (guildData.get(`${player.guildId}.always.enabled`)) return;
				// The bot is not playing anything - leave immediately
				if (!player.queue.current || !player.playing && !player.paused) {
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					logger.info({ message: `[G ${player.guildId}] Disconnecting (alone)`, label: 'Quaver' });
					await player.musicHandler.locale('MUSIC_ALONE_MOVED');
					await player.musicHandler.disconnect();
					return;
				}
				// Vc still has humans - do not set pauseTimeout again
				if (oldState.channel.members.filter(m => !m.user.bot).size >= 1) return;
				// Avoid pauseTimeout if there is pauseTimeout
				if (player.pauseTimeout) return;
				// The bot was playing something - set pauseTimeout
				if (player.queue.current || player.playing && player.paused) {
					await player.pause();
					logger.info({ message: `[G ${player.guildId}] Setting pause timeout`, label: 'Quaver' });
					if (player.pauseTimeout) {
						clearTimeout(player.pauseTimeout);
					}
					player.pauseTimeout = setTimeout(p => {
						logger.info({ message: `[G ${p.guildId}] Disconnecting (inactivity)`, label: 'Quaver' });
						p.musicHandler.locale('MUSIC_INACTIVITY');
						p.musicHandler.disconnect();
					}, 300000, player);
					await player.musicHandler.send(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_WARNING')} ${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_INACTIVITY_WARNING', Math.floor(Date.now() / 1000) + 300)}`, { footer: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_REJOIN') });
				}
			}
		}

		// Join event
		if (newState.channelId && oldState.channelId === null) {
			// Bot join
			if (newState.member.user.id === bot.user.id) {
				// Bot state change
				if ((newState.suppress !== oldState.suppress || newState.serverMute !== oldState.serverMute || newState.serverDeaf !== oldState.serverDeaf) && newState.channelId === oldState.channelId) return console.log('Join: Bot state change');
				// Bot join to voice
				if (newState.channel.type === 'GUILD_VOICE') {
					// Check for connect, speak permission for voice channel
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
					if (!permissions.has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_BASIC');
						return;
					}
					if (guildData.get(`${player.guildId}.always.enabled`) && guildData.get(`${player.guildId}.always.channel`) !== newState.channelId) {
						guildData.set(`${player.guildId}.always.channel`, newState.channelId);
					}
					return console.log('Join: Bot join to voice');
				}
				// Bot join to stage
				if (newState.channel.type === 'GUILD_STAGE_VOICE') {
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
					// Check for connect, speak permission for stage channel
					if (!permissions.has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_BASIC');
						await player.musicHandler.disconnect();
						return;
					}
					if (!permissions.has(Permissions.STAGE_MODERATOR)) {
						if (guildData.get(`${player.guildId}.always.enabled`)) {
							guildData.set(`${player.guildId}.always.enabled`, false);
						}
						await player.musicHandler.locale('MUSIC_FORCED_STAGE');
						await player.musicHandler.disconnect();
						return;
					}
					if (newState.suppress) {
						await newState.setSuppressed(false);
					}
					if (!newState.channel.stageInstance?.topic) {
						try {
							await newState.channel.createStageInstance({ topic: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_STAGE_TOPIC'), privacyLevel: 'GUILD_ONLY' });
						}
						catch (err) {
							logger.error({ message: `${err.message}\n${err.stack}`, label: 'Quaver' });
						}
					}
					if (guildData.get(`${player.guildId}.always.enabled`) && guildData.get(`${player.guildId}.always.channel`) !== newState.channelId) {
						guildData.set(`${player.guildId}.always.channel`, newState.channelId);
					}
					return console.log('Join: Stage, suppress');
				}
				return console.log('Join: Bot join');
			}
			// Human join
			if (!newState.member.user.bot) {
				// Human state change
				if ((newState.suppress !== oldState.suppress || newState.serverMute !== oldState.serverMute || newState.serverDeaf !== oldState.serverDeaf) && newState.channelId === oldState.channelId) return console.log('Join: Human state change');
				// User voiceStateUpdate, the channel is the bot's channel
				// And there is pauseTimeout
				if (newState.channelId === player?.channelId && player?.pauseTimeout) {
					player.resume();
					if (player.pauseTimeout) {
						clearTimeout(player.pauseTimeout);
						delete player.pauseTimeout;
					}
					await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
					return;
				}
			}
		}

		// Move event
		if (oldState.channelId && newState.channelId) {
			// Bot move
			if (oldState.member.user.id === bot.user.id) {
				// Bot state change
				if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && oldState.channelId === newState.channelId) return console.log('Move: Bot state change');
				if (newState.channel.type === 'GUILD_VOICE') {
					// Check for connect, speak permission for voice channel
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
					if (!permissions.has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_BASIC');
						return;
					}
					if (guildData.get(`${player.guildId}.always.enabled`) && guildData.get(`${player.guildId}.always.channel`) !== newState.channelId) {
						guildData.set(`${player.guildId}.always.channel`, newState.channelId);
					}
				}
				// Bot move to stage
				if (newState.channel.type === 'GUILD_STAGE_VOICE') {
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
					// Check for connect, speak permission for stage channel
					if (!permissions.has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_BASIC');
						await player.musicHandler.disconnect();
						return;
					}
					if (!permissions.has(Permissions.STAGE_MODERATOR)) {
						if (guildData.get(`${player.guildId}.always.enabled`)) {
							guildData.set(`${player.guildId}.always.enabled`, false);
						}
						await player.musicHandler.locale('MUSIC_FORCED_STAGE');
						await player.musicHandler.disconnect();
						return;
					}
					if (newState.suppress) {
						await newState.setSuppressed(false);
					}
					if (!newState.channel.stageInstance?.topic) {
						try {
							await newState.channel.createStageInstance({ topic: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_STAGE_TOPIC'), privacyLevel: 'GUILD_ONLY' });
						}
						catch (err) {
							logger.error({ message: `${err.message}\n${err.stack}`, label: 'Quaver' });
						}
					}
					if (guildData.get(`${player.guildId}.always.enabled`) && guildData.get(`${player.guildId}.always.channel`) !== newState.channelId) {
						guildData.set(`${player.guildId}.always.channel`, newState.channelId);
					}
				}
				// The new vc has no humans
				if (newState.channel.members.filter(m => !m.user.bot).size < 1 && !guildData.get(`${player.guildId}.always.enabled`)) {
					// Avoid pauseTimeout if 24/7 is enabled
					if (guildData.get(`${player.guildId}.always.enabled`)) return;
					// The bot is not playing anything - leave immediately
					if (!player.queue.current || !player.playing && !player.paused) {
						if (guildData.get(`${player.guildId}.always.enabled`)) {
							guildData.set(`${player.guildId}.always.enabled`, false);
						}
						logger.info({ message: `[G ${player.guildId}] Disconnecting (alone)`, label: 'Quaver' });
						await player.musicHandler.locale('MUSIC_ALONE_MOVED');
						await player.musicHandler.disconnect();
						return;
					}
					// Avoid pauseTimeout if there is pauseTimeout
					if (player.pauseTimeout) return;
					// The bot was playing something - set pauseTimeout
					if (player.queue.current || player.playing && player.paused) {
						await player.pause();
						logger.info({ message: `[G ${player.guildId}] Setting pause timeout`, label: 'Quaver' });
						if (player.pauseTimeout) {
							clearTimeout(player.pauseTimeout);
						}
						player.pauseTimeout = setTimeout(p => {
							logger.info({ message: `[G ${p.guildId}] Disconnecting (inactivity)`, label: 'Quaver' });
							p.musicHandler.locale('MUSIC_INACTIVITY');
							p.musicHandler.disconnect();
						}, 300000, player);
						await player.musicHandler.send(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_WARNING')} ${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_INACTIVITY_WARNING', Math.floor(Date.now() / 1000) + 300)}`, { footer: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_REJOIN') });
					}
				}
				// The new vc has humans and pauseTimeout is set
				else if (newState.channel.members.filter(m => !m.user.bot).size >= 1 && player.pauseTimeout) {
					player.resume();
					clearTimeout(player.pauseTimeout);
					delete player.pauseTimeout;
					await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
					return;
				}
				return console.log('Move: Bot move');
			}
			// Human move
			if (!oldState.member.user.bot) {
				// Human state change
				if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && oldState.channelId === newState.channelId) return console.log('Move: Human state change');
				// User voiceStateUpdate, the channel is the bot's channel
				// And there is pauseTimeout
				if (newState.channelId === player?.channelId && player?.pauseTimeout) {
					player.resume();
					if (player.pauseTimeout) {
						clearTimeout(player.pauseTimeout);
						delete player.pauseTimeout;
					}
					await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
					return;
				}
				// Avoid pauseTimeout if 24/7 is enabled
				if (guildData.get(`${player.guildId}.always.enabled`)) return;
				// The bot is not playing anything - leave immediately
				if (!player.queue.current || !player.playing && !player.paused) {
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					logger.info({ message: `[G ${player.guildId}] Disconnecting (alone)`, label: 'Quaver' });
					await player.musicHandler.locale('MUSIC_ALONE_MOVED');
					await player.musicHandler.disconnect();
					return;
				}
				// Avoid pauseTimeout if there is pauseTimeout
				if (player.pauseTimeout) return;
				// Vc still has humans - do not set pauseTimeout again
				if (oldState.channel.members.filter(m => !m.user.bot).size >= 1) return;
				// The bot was playing something - set pauseTimeout
				if (player.queue.current || player.playing && player.paused) {
					await player.pause();
					logger.info({ message: `[G ${player.guildId}] Setting pause timeout`, label: 'Quaver' });
					if (player.pauseTimeout) {
						clearTimeout(player.pauseTimeout);
					}
					player.pauseTimeout = setTimeout(p => {
						logger.info({ message: `[G ${p.guildId}] Disconnecting (inactivity)`, label: 'Quaver' });
						p.musicHandler.locale('MUSIC_INACTIVITY');
						p.musicHandler.disconnect();
					}, 300000, player);
					await player.musicHandler.send(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_WARNING')} ${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_INACTIVITY_WARNING', Math.floor(Date.now() / 1000) + 300)}`, { footer: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_REJOIN') });
				}
			}
		}
	},
};
