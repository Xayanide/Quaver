const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { checks } = require('../enums.js');
const { defaultColor, defaultLocale } = require('../settings.json');
const { getLocale, msToTime, msToTimeString } = require('../functions.js');
const { guildData } = require('../data.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('seektime')
		.setDescription(getLocale(defaultLocale, 'CMD_SEEK_DESCRIPTION'))
		.addStringOption(option =>
			option
				.setName('timestamp')
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
		const timestamp = interaction.options.getString('timestamp') ?? 0;
		if (interaction.options.getString('timestamp') === null) {
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
		let split = timestamp.split(':');
		if (split.length > 3) {
			return;
		}
		split = split.reverse();
		const seconds = parseInt(split[0]) ;
		let minutes = 0;
		let hours = 0;
		if (split[1]) {
			minutes = parseInt(split[1]);
		}
		if (split[2]) {
			hours = parseInt(split[2]) ;
		}
		const time = hours * 3600000 + minutes * 60000 + seconds * 1000;
		if (isNaN(time)) {
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
		if (time > trackLength || time < 0 || hours > 23 || minutes > 59 || seconds > 59) {
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
		const seek = msToTime(time);
		const seekString = msToTimeString(seek, true);
		await player.seek(time);
		await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
					.setColor(defaultColor),
			],
		});
	},
};
