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
		if (!player) return;
		// Leave
		if (oldState.channelId && newState.channelId === null) {
			// Bot leave
			if (oldState.member.user.id === bot.user.id) {
				// Bot leave voice
				if (oldState.channel?.type === 'GUILD_VOICE') {
				// Bot state change
					if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && oldState.channelId === newState.channelId) return console.log('Leave: Voice, state change');
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					await player.musicHandler.disconnect();
					return console.log('Leave: Voice, bot leave');
				}
				// Channel was a stage channel, and bot was unsuppressed
				if (oldState.channel?.type === 'GUILD_STAGE_VOICE' && !oldState.suppress) {
				// Bot state change
					if ((oldState.suppress !== newState.suppress || oldState.serverMute !== newState.serverMute || oldState.serverDeaf !== newState.serverDeaf) && oldState.channelId === newState.channelId) return console.log('Leave: Stage, state change');
					if (guildData.get(`${player.guildId}.always.enabled`)) {
						guildData.set(`${player.guildId}.always.enabled`, false);
					}
					await player.musicHandler.disconnect();
					// check for connect, speak permission for voice channel
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(oldState.channelId).permissionsFor(bot.user.id);
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
		}

		// Join
		if (newState.channelId && oldState.channelId === null) {
			// Bot join
			if (newState.member.user.id === bot.user.id) {
				// Bot join to voice
				if (newState.channel.type === 'GUILD_VOICE') {
					// Bot state change
					if ((newState.suppress !== oldState.suppress || newState.serverMute !== oldState.serverMute || newState.serverDeaf !== oldState.serverDeaf) && newState.channelId === oldState.channelId) return console.log('Join: Voice, state change');
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
				// Bot join to stage, suppress
				if (newState.channel.type === 'GUILD_STAGE_VOICE' && newState.suppress) {
					// Bot state change
					if ((newState.suppress !== oldState.suppress || newState.serverMute !== oldState.serverMute || newState.serverDeaf !== oldState.serverDeaf) && newState.channelId === oldState.channelId) return console.log('Join: Stage, state change');
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
					return console.log('Join: Stage, suppress');
				}
				return console.log('Join: Bot join');
			}
		}

		// Move
		if (oldState.channelId && newState.channelId) {
			// Bot old move
			if (oldState.member.user.id === bot.user.id) {
				if (newState.channel.type === 'GUILD_VOICE') {
					// Bot state change
					if ((newState.suppress !== oldState.suppress || newState.serverMute !== oldState.serverMute || newState.serverDeaf !== oldState.serverDeaf) && newState.channelId === oldState.channelId) return console.log('Move: Voice, state change');
					// Check for connect, speak permission for voice channel
					const permissions = bot.guilds.cache.get(guild.id).channels.cache.get(newState.channelId).permissionsFor(bot.user.id);
					if (!permissions.has(['VIEW_CHANNEL', 'CONNECT', 'SPEAK'])) {
						await player.musicHandler.locale('DISCORD_BOT_MISSING_PERMISSIONS_BASIC');
						return;
					}
					if (guildData.get(`${player.guildId}.always.enabled`) && guildData.get(`${player.guildId}.always.channel`) !== newState.channelId) {
						guildData.set(`${player.guildId}.always.channel`, newState.channelId);
					}
					return;
				}
				// Bot move to stage, suppress
				if (newState.channel.type === 'GUILD_STAGE_VOICE' && newState.suppress) {
					// Bot state change
					if ((newState.suppress !== oldState.suppress || newState.serverMute !== oldState.serverMute || newState.serverDeaf !== oldState.serverDeaf) && newState.channelId === oldState.channelId) return console.log('Move: Stage, state change');
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
					return;
				}
				return console.log('Move: Bot move');
			}
		}
	},
};
