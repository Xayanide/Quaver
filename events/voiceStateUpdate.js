const { Permissions } = require('discord.js');
const { logger, guildData } = require('../shared.js');
const { getLocale } = require('../functions.js');
const { bot } = require('../main.js');
const { defaultLocale } = require('../settings.json');

module.exports = {
	name: 'voiceStateUpdate',
	once: false,
	async execute(oldState, newState) {
		/**
		 * WARNING:
		 * Repetitive code ahead.
		 */
		const guild = oldState.guild;
		const player = bot.music.players.get(guild.id);

		/**
		 * Someone left a channel
		 */
		if (oldState.channelId && newState.channelId === null) {
			// Quaver left
			if (oldState.member.user.id === bot.user.id) {
				// There was no player
				if (!player) return console.log('Quaver left, but no player');
				// Channel was a VOICE channel
				if (oldState.channel.type === 'GUILD_VOICE') {
					logger.info({ message: `[G ${player.guildId}] Cleaning up`, label: 'Quaver' });
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					await player.musicHandler.disconnect();
					console.log('Quaver left a VOICE channel');
				}
				// Channel was a STAGE channel
				if (oldState.channel.type === 'GUILD_STAGE_VOICE') {
					const success = await player.musicHandler.locale('MUSIC_FORCED');
					logger.info({ message: `[G ${player.guildId}] Cleaning up`, label: 'Quaver' });
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					await player.musicHandler.disconnect();
					// Check for permissions
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(oldState.channelId).permissionsFor(bot.user.id);
					if (!permissions.has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_BASIC');
						return;
					}
					if (!permissions.has(Permissions.STAGE_MODERATOR)) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_STAGE');
						return;
					}
					// Probably no permissions from guildDelete, don't even bother ending the stage.
					if (!success) return;
					// Channel had a STAGE instance
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
			}
			// Human left
			if (!oldState.member.user.bot) {
				if (!player) return console.log('Human left, but no player');
				const oldVoiceChannel = bot.guilds.cache.get(guild.id).channels.cache.get(oldState.channelId);
				// Left from VOICE
				if (oldVoiceChannel.type === 'GUILD_VOICE') {
					// Bot was in the channel
					if (oldVoiceChannel.members.has(bot.user.id)) {
						// Nothing is playing, has people and 24/7 was disabled.
						if (oldVoiceChannel.members.filter(m => !m.user.bot).size >= 1 && (!player.queue.current || !player.playing && !player.paused) && !guildData.get(`${player.guildId}.always.enabled`)) {
							logger.info({ message: `[G ${player.guildId}] Cleaning up`, label: 'Human' });
							await player.musicHandler.disconnect();
							return console.log('Human left a VOICE channel, no playing, 24/7 false');
						}
						// There was a track playing, has people and 24/7 was disabled.
						if (oldVoiceChannel.members.filter(m => !m.user.bot).size >= 1 && !guildData.get(`${player.guildId}.always.enabled`)) {
							// Set pause Timeout
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
				// Left from STAGE
				if (oldVoiceChannel.type === 'GUILD_STAGE_VOICE') {
					// Bot was in the channel
					if (oldVoiceChannel.members.has(bot.user.id)) {
						// Nothing is playing and 24/7 was disabled.
						if ((!player.queue.current || !player.playing && !player.paused) && !guildData.get(`${player.guildId}.always.enabled`)) {
							logger.info({ message: `[G ${player.guildId}] Cleaning up`, label: 'Human' });
							await player.musicHandler.disconnect();
							return console.log('Human left a VOICE channel, no playing, 24/7 false');
						}
						// There was a track playing and 24/7 was disabled.
						if (!guildData.get(`${player.guildId}.always.enabled`)) {
							// There are still people, do not set pause time out twice
							if (oldVoiceChannel.members.filter(m => !m.user.bot).size >= 1) return;

							// Set pause Timeout
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
				return console.log('Human left');
			}
		}

		/**
		 * Someone joined a channel
		 */
		if (newState.channelId && oldState.channelId === null) {
			// Quaver joined
			if (newState.member.user.id === bot.user.id) {
				// There was no player
				if (!player) return console.log('Quaver joined, but no player');
				// Channel is a VOICE channel
				if (newState.channel.type === 'GUILD_VOICE') {
					console.log('Quaver joined a VOICE channel');
				}
				// Channel is a STAGE channel
				if (newState.channel.type === 'GUILD_STAGE_VOICE') {
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
					// Check for permissions
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
			}
			// Human joined
			if (!newState.member.user.bot) {
				// There was no player
				if (!player) return console.log('Human joined, but no player');
				const newVoiceChannel = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId);
				// Joined in VOICE
				if (newVoiceChannel.type === 'GUILD_VOICE') {
					if (newVoiceChannel.members.filter(m => !m.user.bot).size >= 1 && player.pauseTimeout) {
						player.resume();
						clearTimeout(player.pauseTimeout);
						delete player.pauseTimeout;
						await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
						return;
					}
				}
				// Joined in STAGE
				if (newVoiceChannel.type === 'GUILD_STAGE_VOICE') {
					if (newVoiceChannel.members.filter(m => !m.user.bot).size >= 1 && player.pauseTimeout) {
						player.resume();
						clearTimeout(player.pauseTimeout);
						delete player.pauseTimeout;
						await player.musicHandler.locale('MUSIC_ALONE_RESUMED');
						return;
					}
				}
			}
		}

		/**
		 * Someone moved
		 */
		if (newState.channelId && oldState.channelId) {
			// Quaver moved
			if (newState.member.user.id === bot.user.id) {
				// There was no player
				if (!player) return console.log('Quaver moved, but no player');
				// Moved from VOICE to STAGE
				if (oldState.channel.type === 'GUILD_VOICE' && newState.channel.type === 'GUILD_STAGE_VOICE') {
					if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && newState.channelId === oldState.channelId) {
						// Quaver suppress states
						if (oldState.member.user.id === bot.user.id) {
							return console.log('Quaver suppress states 1');
						}
					}
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
					// check for connect, speak permission for stage channel
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
					// Moved to a STAGE channel with no humans and 24/7 is not enabled
					if (newState.channel.members.filter(m => !m.user.bot).size < 1 && !guildData.get(`${player.guildId}.always.enabled`)) {
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
					}
					return console.log('Quaver moved from VOICE to STAGE');
				}
				// Moved from STAGE to STAGE
				if (oldState.channel.type === 'GUILD_STAGE_VOICE' && newState.channel.type === 'GUILD_STAGE_VOICE') {
					if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && newState.channelId === oldState.channelId) {
						// Quaver suppress states
						if (oldState.member.user.id === bot.user.id) {
							return console.log('Quaver suppress states 2');
						}
					}
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
					// check for connect, speak permission for stage channel
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
					// Moved to a STAGE channel with no humans and 24/7 is not enabled
					if (newState.channel.members.filter(m => !m.user.bot).size < 1 && !guildData.get(`${player.guildId}.always.enabled`)) {
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
					}
					return console.log('Quaver moved from STAGE to STAGE');
				}
				// Moved from STAGE to VOICE
				if (newState.channel.type === 'GUILD_STAGE_VOICE' && oldState.channel.type === 'GUILD_VOICE') {
					// Moved to a VOICE channel with no humans and 24/7 is not enabled
					if (newState.channel.members.filter(m => !m.user.bot).size < 1 && !guildData.get(`${player.guildId}.always.enabled`)) {
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
					}
					return console.log('Quaver moved from STAGE to VOICE');
				}
				// Moved from VOICE to VOICE
				if (newState.channel.type === 'GUILD_VOICE' && oldState.channel.type === 'GUILD_VOICE') {
					// Moved to a VOICE channel with no humans and 24/7 is not enabled
					if (newState.channel.members.filter(m => !m.user.bot).size < 1 && !guildData.get(`${player.guildId}.always.enabled`)) {
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
					}
					return console.log('Quaver moved from VOICE to VOICE');
				}
			}
			// Human moved
			if (!newState.member.user.bot) {
				return console.log('Human moved');
			}
		}
	},
};
