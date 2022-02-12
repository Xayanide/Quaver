const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { checks } = require('../enums.js');
const { defaultColor, defaultLocale } = require('../settings.json');
const { getLocale, msToTime, msToTimeString } = require('../functions.js');
const { guildData } = require('../data.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('seekhuman')
		.setDescription(getLocale(defaultLocale, 'CMD_SEEK_DESCRIPTION'))
		.addStringOption(option =>
			option
				.setName('time')
				.setDescription(getLocale(defaultLocale, 'CMD_SEEK_DESCRIPTION'))),
	checks: [checks.GUILD_ONLY, checks.ACTIVE_SESSION, checks.IN_VOICE, checks.IN_SESSION_VOICE],
	permissions: {
		user: [],
		bot: [],
	},
	async execute(interaction) {
		const player = interaction.client.music.players.get(interaction.guildId);
		if (!player.queue.current || !player.playing && !player.paused) {
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'MUSIC_QUEUE_NOT_PLAYING'))
						.setColor('DARK_RED'),
				],
				ephemeral: true,
			});
			return;
		}
		if (player.queue.current.isStream) {
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_IS_STREAM'))
						.setColor('DARK_RED'),
				],
				ephemeral: true,
			});
			return;
		}
		if (interaction.options.getString('time') === null || interaction.options.getString(('time') ?? 0).match(/\d+\s?\w/g) === null) {
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_UNSPECIFIED_TIMESTAMP'))
						.setColor('DARK_RED'),
				],
				ephemeral: true,
			});
			return;
		}
		const ms = interaction.options.getString('time').match(/\d+\s?\w/g).reduce((acc, cur) => acc + (parseInt(cur) || 0) * 1000 * (cur.slice(-1) === 'h' ? 3600 : cur.slice(-1) === 'm' ? 60 : 1), 0);
		if (isNaN(ms)) {
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_UNSPECIFIED_TIMESTAMP'))
						.setColor('DARK_RED'),
				],
				ephemeral: true,
			});
			return;
		}
		const trackLength = player.queue.current.length;
		const duration = msToTime(trackLength);
		const durationString = msToTimeString(duration, true);
		if (ms > trackLength || ms < 0) {
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_INVALID_TIMESTAMP', durationString))
						.setColor('DARK_RED'),
				],
				ephemeral: true,
			});
			return;
		}
		const seek = msToTime(ms);
		const seekString = msToTimeString(seek, true);
		await player.seek(ms);
		await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
					.setColor(defaultColor),
			],
		});
	},
};
