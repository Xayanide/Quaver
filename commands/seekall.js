const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { checks } = require('../enums.js');
const { defaultColor, defaultLocale } = require('../settings.json');
const { getLocale, msToTime, msToTimeString } = require('../functions.js');
const { guildData } = require('../data.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('seekall')
		.setDescription(getLocale(defaultLocale, 'CMD_SEEK_DESCRIPTION'))
		.addStringOption(option =>
			option
				.setName('timestamp')
				.setDescription(getLocale(defaultLocale, 'CMD_SEEK_DESCRIPTION')))
		.addStringOption(option =>
			option
				.setName('humantime')
				.setDescription(getLocale(defaultLocale, 'CMD_SEEK_DESCRIPTION')))
		.addIntegerOption(option =>
			option
				.setName('hours')
				.setDescription(getLocale(defaultLocale, 'CMD_SEEK_OPTION_HOURS'))
				.setMinValue(0)
				.setMaxValue(23))
		.addIntegerOption(option =>
			option
				.setName('minutes')
				.setDescription(getLocale(defaultLocale, 'CMD_SEEK_OPTION_MINUTES'))
				.setMinValue(0)
				.setMaxValue(59))
		.addIntegerOption(option =>
			option
				.setName('seconds')
				.setDescription(getLocale(defaultLocale, 'CMD_SEEK_OPTION_SECONDS'))
				.setMinValue(0)
				.setMaxValue(59)),
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
		// Null checks
		if (interaction.options.getString('timestamp') === null && interaction.options.getString('humantime') === null && interaction.options.getInteger('hours') === null && interaction.options.getInteger('minutes') === null && interaction.options.getInteger('seconds') === null) {
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
		if (interaction.options.getString('humantime').match(/\d+\s?\w/g) === null) {
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
		const options = interaction.options.getInteger('hours') * 3600000 + interaction.options.getInteger('minutes') * 60000 + interaction.options.getInteger('seconds') * 1000;
		const trackLength = player.queue.current.length;
		const duration = msToTime(trackLength);
		const durationString = msToTimeString(duration, true);
		// Timestamp has ':'
		if (interaction.options.getString('timestamp') !== null) {
			console.log('Timestamp has format');
			let split = interaction.options.getString('timestamp').split(':');
			if (split.length > 3) { return; }
			split = split.reverse();
			const seconds = parseInt(split[0]) ;
			let minutes = 0;
			let hours = 0;
			if (split[1]) { minutes = parseInt(split[1]); }
			if (split[2]) { hours = parseInt(split[2]); }
			const stamp = hours * 3600000 + minutes * 60000 + seconds * 1000;
			// Timestamp NaN
			if (isNaN(stamp)) {
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
			// Timestamp + Humantime
			if (interaction.options.getString('timestamp') && interaction.options.getString('humantime') && !interaction.options.getInteger('hours') && !interaction.options.getInteger('minutes') && !interaction.options.getInteger('seconds')) {
				console.log('Timestamp + Humantime');
				const human = interaction.options.getString('humantime').match(/\d+\s?\w/g).reduce((acc, cur) => acc + (parseInt(cur) || 0) * 1000 * (cur.slice(-1) === 'h' ? 3600 : cur.slice(-1) === 'm' ? 60 : 1), 0);
				const stamphuman = stamp + human;

				if (stamphuman < 0 || hours > 23 || minutes > 59 || seconds > 59) {
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
				if (stamphuman > trackLength) {
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
				const seek = msToTime(stamphuman);
				const seekString = msToTimeString(seek, true);
				await player.seek(stamphuman);
				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
							.setColor(defaultColor),
					],
				});
				return;
			}
			// All options (Timestamp + Humantime + Options)
			if (interaction.options.getString('timestamp') && interaction.options.getString('humantime') && interaction.options.getInteger('hours') + interaction.options.getInteger('minutes') + interaction.options.getInteger('seconds')) {
				console.log('All options (Timestamp + Humantime + Options)');
				const human = interaction.options.getString('humantime').match(/\d+\s?\w/g).reduce((acc, cur) => acc + (parseInt(cur) || 0) * 1000 * (cur.slice(-1) === 'h' ? 3600 : cur.slice(-1) === 'm' ? 60 : 1), 0);
				const allOptions = stamp + human + options;
				if (allOptions < 0 || hours > 23 || minutes > 59 || seconds > 59) {
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
				if (allOptions > trackLength) {
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
				const seek = msToTime(allOptions);
				const seekString = msToTimeString(seek, true);
				await player.seek(allOptions);
				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
							.setColor(defaultColor),
					],
				});
				return;
			}
			// Timestamp + Options Except Human time
			if (!interaction.options.getString('humantime') && interaction.options.getString('timestamp') && interaction.options.getInteger('hours') + interaction.options.getInteger('minutes') + interaction.options.getInteger('seconds')) {
				console.log('Timestamp + Options Except human time');
				const stampOptions = stamp + options;
				if (stampOptions < 0 || hours > 23 || minutes > 59 || seconds > 59) {
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
				if (stampOptions > trackLength) {
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
				const seek = msToTime(stampOptions);
				const seekString = msToTimeString(seek, true);
				await player.seek(stampOptions);
				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
							.setColor(defaultColor),
					],
				});
				return;
			}
			// Timestamp only
			if (interaction.options.getString('timestamp') && !interaction.options.getInteger('hours') && !interaction.options.getInteger('minutes') && !interaction.options.getInteger('seconds')) {
				console.log('Timestamp only');
				if (stamp < 0 || hours > 23 || minutes > 59 || seconds > 59) {
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
				if (stamp > trackLength) {
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
				const seek = msToTime(stamp);
				const seekString = msToTimeString(seek, true);
				await player.seek(stamp);
				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
							.setColor(defaultColor),
					],
				});
				return;
			}
		}
		// Humantime has format
		if (interaction.options.getString('humantime') !== null) {
			console.log('Humantime has format');
			const human = interaction.options.getString('humantime').match(/\d+\s?\w/g).reduce((acc, cur) => acc + (parseInt(cur) || 0) * 1000 * (cur.slice(-1) === 'h' ? 3600 : cur.slice(-1) === 'm' ? 60 : 1), 0);
			// Humantime NaN
			if (isNaN(human)) {
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
			// Humantime + Options Except Timestamp
			if (!interaction.options.getString('timestamp') && interaction.options.getString('humantime') && interaction.options.getInteger('hours') + interaction.options.getInteger('minutes') + interaction.options.getInteger('seconds')) {
				console.log('Humantime + Options Except Timestamp');
				const humanOptions = human + options;
				if (humanOptions < 0) {
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
				if (humanOptions > trackLength) {
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
				const seek = msToTime(humanOptions);
				const seekString = msToTimeString(seek, true);
				await player.seek(humanOptions);
				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
							.setColor(defaultColor),
					],
				});
				return;
			}
			// Humantime only
			if (interaction.options.getString('humantime') && !interaction.options.getInteger('hours') && !interaction.options.getInteger('minutes') && !interaction.options.getInteger('seconds')) {
				console.log('Humantime only');
				if (human < 0) {
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
				if (human > trackLength) {
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
				const seek = msToTime(human);
				const seekString = msToTimeString(seek, true);
				await player.seek(human);
				await interaction.reply({
					embeds: [
						new MessageEmbed()
							.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
							.setColor(defaultColor),
					],
				});
				return;
			}
		}
		// Hours, minutes, seconds
		if (!interaction.options.getString('timestamp') && !interaction.options.getString('humantime') && interaction.options.getInteger('hours') + interaction.options.getInteger('minutes') + interaction.options.getInteger('seconds')) {
			console.log('Hours, minutes, seconds');
			if (options > trackLength) {
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
			const seek = msToTime(options);
			const seekString = msToTimeString(seek, true);
			await player.seek(options);
			await interaction.reply({
				embeds: [
					new MessageEmbed()
						.setDescription(getLocale(guildData.get(`${interaction.guildId}.locale`) ?? defaultLocale, 'CMD_SEEK_SUCCESS', seekString, durationString))
						.setColor(defaultColor),
				],
			});
			return;
		}
	},
};
