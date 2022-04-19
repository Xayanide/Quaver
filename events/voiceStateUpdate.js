const { Permissions } = require('discord.js');
const { logger, guildData } = require('../shared.js');
const { getLocale } = require('../functions.js');
const { bot } = require('../main.js');
const { defaultLocale } = require('../settings.json');

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(oldState, newState) {
		const guild = oldState.guild;
		const player = bot.music.players.get(guild.id);

		/**
		 * WARNING:
		 * Repetitive code ahead
		 * https://www.youtube.com/watch?v=UnIhRpIT7nc
		 */

		/**
		 * Someone left
		 */
		if (oldState.channelId && newState.channelId === null) {
			/**
			 * Quaver left
			 */
			if (oldState.member.user.id === bot.user.id) {
				// Quaver left but no player
				if (!player) return console.log('Quaver left, but no player');
				// Quaver left in VOICE
				if (oldState.channel.type === 'GUILD_VOICE') {
					logger.info({ message: `[G ${player.guildId}] Cleaning up`, label: 'Quaver Leave' });
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					await player.musicHandler.disconnect();
					return console.log('Quaver left a VOICE channel');
				}
				// Quaver left in STAGE
				const success = await player.musicHandler.locale('MUSIC_FORCED');
				if (oldState.channel.type === 'GUILD_STAGE_VOICE') {
					logger.info({ message: `[G ${player.guildId}] Cleaning up`, label: 'Quaver Leave' });
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					await player.musicHandler.disconnect();
					// Check for permissions for STAGE
					const permissions = bot.guilds.cache.get(guild.id)?.channels.cache.get(oldState.channelId).permissionsFor(bot.user.id);
					if (!permissions.has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_BASIC');
						return;
					}
					if (!permissions.has(Permissions.STAGE_MODERATOR)) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_STAGE');
						return;
					}
					// Probably no permissions from guildDelete, don't even bother ending the stage
					if (!success) return;
					if (oldState.channel.stageInstance?.topic === getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_STAGE_TOPIC')) {
						try {
							await oldState.channel.stageInstance.delete();
						}
						catch (err) {
							logger.error({ message: `${err.message}\n${err.stack}`, label: 'Quaver' });
						}
					}
					return console.log('Quaver left a STAGE channel');
				}
				return console.log('Quaver left a channel');
			}
			/**
			 * Human left
			 */
			if (!oldState.member.user.bot) {
				// Human left but no player
				if (!player) return console.log('Human left, but no player');
				const oldVoiceChannel = bot.guilds.cache.get(guild.id).channels.cache.get(oldState.channelId);
				// Human left in VOICE
				if (oldVoiceChannel.type === 'GUILD_VOICE') {
					// Bot was in VOICE
					if (oldVoiceChannel.members.has(bot.user.id)) {
						// 24/7 is enabled, do not set pauseTimeout
						if (guildData.get(`${player.guildId}.always.enabled`)) return;
						// Nothing is playing, and there no humans
						if (!player.queue.current || !player.playing && !player.paused) {
							logger.info({ message: `[G ${player.guildId}] Cleaning up`, label: 'Human' });
							player.musicHandler.locale('MUSIC_ALONE');
							await player.musicHandler.disconnect();
							return console.log('Human left a VOICE channel, no playing, 24/7 false');
						}
						// There was a track playing and there is no pauseTimeout
						if	(!player.pauseTimeout && (player.queue.current || player.playing && player.paused)) {
							// Set pauseTimeout
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
				// Human left in STAGE
				if (oldVoiceChannel.type === 'GUILD_STAGE_VOICE') {
					// Bot was in STAGE
					if (oldVoiceChannel.members.has(bot.user.id)) {
						// 24/7 is enabled, do not set pauseTimeOut
						if (guildData.get(`${player.guildId}.always.enabled`)) return;
						// Nothing is playing, and there no humans
						if (!player.queue.current || !player.playing && !player.paused) {
							logger.info({ message: `[G ${player.guildId}] Cleaning up`, label: 'Quaver' });
							player.musicHandler.locale('MUSIC_ALONE');
							await player.musicHandler.disconnect();
							return console.log('Human left a STAGE channel, no playing, 24/7 false');
						}
						// There was a track playing and there is no pauseTimeout
						if	(!player.pauseTimeout && (player.queue.current || player.playing && player.paused)) {
						// Set pauseTimeout
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
				return console.log('Human left a channel');
			}
		}

		/**
		 * Someone joined
		 */
		if (newState.channelId && oldState.channelId === null) {
			/**
			 * Quaver joined
			 */
			if (newState.member.user.id === bot.user.id) {
				// Quaver joined but no player
				if (!player) return console.log('Quaver joined, but no player');
				// Quaver joined in VOICE
				if (newState.channel.type === 'GUILD_VOICE') {
					console.log('Quaver joined a VOICE channel');
				}
				// Quaver joined in STAGE
				if (newState.channel.type === 'GUILD_STAGE_VOICE') {
					// Catch state change
					if ((newState.suppress !== oldState.suppress || newState.serverMute !== oldState.serverMute || newState.serverDeaf !== oldState.serverDeaf) && oldState.channelId === newState.channelId) {
						if (oldState.member.user.id === bot.user.id) {
							return console.log('Join, state change, STAGE');
						}
					}
					// Check for permissions for STAGE
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
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
					await newState.setSuppressed(false);
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
					return console.log('Quaver joined a STAGE channel');
				}
				return console.log('Quaver joined a channel');
			}
			/**
			 * Human joined
			 */
			if (!newState.member.user.bot) {
				// Human joined but no player
				if (!player) return console.log('Human joined, but no player');
				const newVoiceChannel = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId);
				// Human joined in VOICE
				if (newVoiceChannel.type === 'GUILD_VOICE') {
					// In Quaver's channel, Quaver has pauseTimeout
					if (newVoiceChannel.members.has(bot.user.id) && player.pauseTimeout) {
						player.resume();
						clearTimeout(player.pauseTimeout);
						delete player.pauseTimeout;
						await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
					}
				}
				// Human joined in STAGE
				if (newVoiceChannel.type === 'GUILD_STAGE_VOICE') {
					// In Quaver's channel, Quaver has pauseTimeout
					if (newVoiceChannel.members.has(bot.user.id) && player.pauseTimeout) {
						player.resume();
						clearTimeout(player.pauseTimeout);
						delete player.pauseTimeout;
						await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
					}
				}
				return console.log('Human joined a channel');
			}
		}

		/**
		 * Someone moved
		 */
		if (newState.channelId && oldState.channelId) {
			/**
			 * Quaver moved
			 */
			if (newState.member.user.id === bot.user.id) {
				// Quaver moved but no player
				if (!player) return console.log('Quaver moved, but no player');
				// Quaver moved VOICE to STAGE
				if (oldState.channel.type === 'GUILD_VOICE' && newState.channel.type === 'GUILD_STAGE_VOICE') {
					// Catch state change
					if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && newState.channelId === oldState.channelId) {
						if (oldState.member.user.id === bot.user.id) {
							return console.log('Moved, state change, VOICE to STAGE');
						}
					}
					// Check for permissions for STAGE
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
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
					await newState.setSuppressed(false);
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
					// 24/7 is enabled, do not set pauseTimeout
					if (guildData.get(`${player.guildId}.always.enabled`)) return;
					// No humans in STAGE
					if (newState.channel.members.filter(m => !m.user.bot).size < 1) {
						// Nothing is playing, leave immediately
						if (!player.queue.current || !player.playing && !player.paused) {
							if (guildData.get(`${player.guildId}.always.enabled`)) {
								guildData.set(`${player.guildId}.always.enabled`, false);
							}
							logger.info({ message: `[G ${player.guildId}] Disconnecting (alone)`, label: 'Quaver' });
							await player.musicHandler.locale('MUSIC_ALONE_MOVED');
							await player.musicHandler.disconnect();
							return;
						}
					}
					// There was a track playing and there is no pauseTimeout
					if (!player.pauseTimeout && (player.queue.current || player.playing && player.paused)) {
						// Set pauseTimeout
						await player.pause();
						logger.info({ message: `[G ${player.guildId}] Setting pause timeout`, label: 'Quaver' });
						player.pauseTimeout = setTimeout(p => {
							logger.info({ message: `[G ${p.guildId}] Disconnecting (inactivity)`, label: 'Quaver' });
							p.musicHandler.locale('MUSIC_INACTIVITY');
							p.musicHandler.disconnect();
						}, 300000, player);
						await player.musicHandler.send(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_WARNING')} ${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_INACTIVITY_WARNING', Math.floor(Date.now() / 1000) + 300)}`, { footer: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_REJOIN') });
						return;
					}
					return console.log('Quaver moved from VOICE to STAGE');
				}
				// Quaver moved STAGE to STAGE
				if (oldState.channel.type === 'GUILD_STAGE_VOICE' && newState.channel.type === 'GUILD_STAGE_VOICE') {
					// Catch state change
					if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && newState.channelId === oldState.channelId) {
						if (oldState.member.user.id === bot.user.id) {
							return console.log('Moved, state change, STAGE to STAGE');
						}
					}
					// Check for permissions for STAGE
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
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
					await newState.setSuppressed(false);
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
					// 24/7 is enabled, do not set pauseTimeout
					if (guildData.get(`${player.guildId}.always.enabled`)) return;
					// No humans in STAGE
					if (newState.channel.members.filter(m => !m.user.bot).size < 1) {
						// Nothing is playing, leave immediately
						if (!player.queue.current || !player.playing && !player.paused) {
							if (guildData.get(`${player.guildId}.always.enabled`)) {
								guildData.set(`${player.guildId}.always.enabled`, false);
							}
							logger.info({ message: `[G ${player.guildId}] Disconnecting (alone)`, label: 'Quaver' });
							await player.musicHandler.locale('MUSIC_ALONE_MOVED');
							await player.musicHandler.disconnect();
							return;
						}
					}
					// There was a track playing and there is no pauseTimeout
					if (!player.pauseTimeout && (player.queue.current || player.playing && player.paused)) {
						// Set pauseTimeout
						await player.pause();
						logger.info({ message: `[G ${player.guildId}] Setting pause timeout`, label: 'Quaver' });
						player.pauseTimeout = setTimeout(p => {
							logger.info({ message: `[G ${p.guildId}] Disconnecting (inactivity)`, label: 'Quaver' });
							p.musicHandler.locale('MUSIC_INACTIVITY');
							p.musicHandler.disconnect();
						}, 300000, player);
						await player.musicHandler.send(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_WARNING')} ${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_INACTIVITY_WARNING', Math.floor(Date.now() / 1000) + 300)}`, { footer: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_REJOIN') });
						return;
					}
					return console.log('Quaver moved from STAGE to STAGE');
				}
				// Quaver moved STAGE to VOICE
				if (newState.channel.type === 'GUILD_STAGE_VOICE' && oldState.channel.type === 'GUILD_VOICE') {
					// 24/7 is enabled, do not set pauseTimeout
					if (guildData.get(`${player.guildId}.always.enabled`)) return;
					// No humans in VOICE
					if (newState.channel.members.filter(m => !m.user.bot).size < 1) {
						// Nothing is playing, leave immediately
						if (!player.queue.current || !player.playing && !player.paused) {
							if (guildData.get(`${player.guildId}.always.enabled`)) {
								guildData.set(`${player.guildId}.always.enabled`, false);
							}
							logger.info({ message: `[G ${player.guildId}] Disconnecting (alone)`, label: 'Quaver' });
							await player.musicHandler.locale('MUSIC_ALONE_MOVED');
							await player.musicHandler.disconnect();
							return;
						}
					}
					// There was a track playing and there is no pauseTimeout
					if (!player.pauseTimeout && (player.queue.current || player.playing && player.paused)) {
						// Set pauseTimeout
						await player.pause();
						logger.info({ message: `[G ${player.guildId}] Setting pause timeout`, label: 'Quaver' });
						player.pauseTimeout = setTimeout(p => {
							logger.info({ message: `[G ${p.guildId}] Disconnecting (inactivity)`, label: 'Quaver' });
							p.musicHandler.locale('MUSIC_INACTIVITY');
							p.musicHandler.disconnect();
						}, 300000, player);
						await player.musicHandler.send(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_WARNING')} ${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_INACTIVITY_WARNING', Math.floor(Date.now() / 1000) + 300)}`, { footer: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_REJOIN') });
						return;
					}
					return console.log('Quaver moved from STAGE to VOICE');
				}
				// Quaver moved VOICE to VOICE
				if (newState.channel.type === 'GUILD_VOICE' && oldState.channel.type === 'GUILD_VOICE') {
					// 24/7 is enabled, do not set pauseTimeout
					if (guildData.get(`${player.guildId}.always.enabled`)) return;
					// No humans in VOICE
					if (newState.channel.members.filter(m => !m.user.bot).size < 1) {
						// Nothing is playing, leave immediately
						if (!player.queue.current || !player.playing && !player.paused) {
							if (guildData.get(`${player.guildId}.always.enabled`)) {
								guildData.set(`${player.guildId}.always.enabled`, false);
							}
							logger.info({ message: `[G ${player.guildId}] Disconnecting (alone)`, label: 'Quaver' });
							await player.musicHandler.locale('MUSIC_ALONE_MOVED');
							await player.musicHandler.disconnect();
							return;
						}
					}
					// There was a track playing and there is no pauseTimeout
					if (!player.pauseTimeout && (player.queue.current || player.playing && player.paused)) {
						// Set pauseTimeout
						await player.pause();
						logger.info({ message: `[G ${player.guildId}] Setting pause timeout`, label: 'Quaver' });
						player.pauseTimeout = setTimeout(p => {
							logger.info({ message: `[G ${p.guildId}] Disconnecting (inactivity)`, label: 'Quaver' });
							p.musicHandler.locale('MUSIC_INACTIVITY');
							p.musicHandler.disconnect();
						}, 300000, player);
						await player.musicHandler.send(`${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_WARNING')} ${getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_INACTIVITY_WARNING', Math.floor(Date.now() / 1000) + 300)}`, { footer: getLocale(guildData.get(`${player.guildId}.locale`) ?? defaultLocale, 'MUSIC_ALONE_REJOIN') });
						return;
					}
					return console.log('Quaver moved from VOICE to VOICE');
				}
			}
			/**
			 * Human moved
			 */
			if (!newState.member.user.bot) {
				// Human moved but no player
				if (!player) return console.log('Human moved but, no player');
				const newVoiceChannel = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId);
				// Human moved to VOICE
				if (newVoiceChannel.type === 'GUILD_VOICE') {
					// In Quaver's channel, Quaver has pauseTimeout.
					if (newVoiceChannel.members.has(bot.user.id) && player.pauseTimeout) {
						player.resume();
						clearTimeout(player.pauseTimeout);
						delete player.pauseTimeout;
						await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
					}
				}
				// Human moved to STAGE
				if (newVoiceChannel.type === 'GUILD_STAGE_VOICE') {
					// In Quaver's channel, Quaver has pauseTimeout.
					if (newVoiceChannel.members.has(bot.user.id) && player.pauseTimeout) {
						player.resume();
						clearTimeout(player.pauseTimeout);
						delete player.pauseTimeout;
						await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
					}
				}
			}
		}
	},
};
