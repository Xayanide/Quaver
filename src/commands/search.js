import { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder, ChannelType, EmbedBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } from 'discord.js';
import { defaultLocale } from '#settings';
import { checks } from '#lib/util/constants.js';
import { getGuildLocale, getLocale, messageDataBuilder, msToTime, msToTimeString, paginate } from '#lib/util/util.js';
import { searchState } from '#lib/util/common.js';

// credit: https://github.com/lavaclient/djs-v13-example/blob/main/src/commands/Play.ts

export default {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription(getLocale(defaultLocale, 'CMD.SEARCH.DESCRIPTION'))
		.addStringOption(option =>
			option
				.setName('query')
				.setDescription(getLocale(defaultLocale, 'CMD.SEARCH.OPTION.QUERY'))
				.setRequired(true)
				.setAutocomplete(true)),
	checks: [checks.GUILD_ONLY],
	permissions: {
		user: [],
		bot: [],
	},
	/** @param {import('discord.js').ChatInputCommandInteraction & {client: import('discord.js').Client, replyHandler: import('#lib/ReplyHandler.js').default}} interaction */
	async execute(interaction) {
		if (![ChannelType.GuildText, ChannelType.GuildVoice].includes(interaction.channel.type)) return interaction.replyHandler.locale('DISCORD.CHANNEL_UNSUPPORTED', { type: 'error' });
		await interaction.deferReply();
		const query = interaction.options.getString('query');
		let tracks = [];

		const results = await interaction.client.music.rest.loadTracks(`ytsearch:${query}`);
		if (results.loadType === 'SEARCH_RESULT') tracks = results.tracks;

		if (tracks.length <= 1) return interaction.replyHandler.locale('CMD.SEARCH.RESPONSE.USE_PLAY_CMD', { type: 'error' });

		const pages = paginate(tracks, 10);
		const msg = await interaction.replyHandler.reply(
			new EmbedBuilder()
				.setDescription(
					pages[0].map((track, index) => {
						const duration = msToTime(track.info.length);
						const durationString = track.info.isStream ? '∞' : msToTimeString(duration, true);
						return `\`${(index + 1).toString().padStart(tracks.length.toString().length, ' ')}.\` **[${escapeMarkdown(track.info.title)}](${track.info.uri})** \`[${durationString}]\``;
					}).join('\n'),
				)
				.setFooter({ text: await getGuildLocale(interaction.guildId, 'MISC.PAGE', '1', pages.length) }),
			{
				components: [
					new ActionRowBuilder()
						.addComponents(
							new SelectMenuBuilder()
								.setCustomId('search')
								.setPlaceholder(await getGuildLocale(interaction.guildId, 'CMD.SEARCH.MISC.PICK'))
								.addOptions(pages[0].map((track, index) => {
									let label = `${index + 1}. ${track.info.title}`;
									if (label.length >= 100) label = `${label.substring(0, 97)}...`;
									return { label: label, description: track.info.author, value: track.info.identifier };
								}))
								.setMinValues(0)
								.setMaxValues(pages[0].length),
						),
					new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('search_0')
								.setEmoji('⬅️')
								.setDisabled(true)
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('search_2')
								.setEmoji('➡️')
								.setDisabled(pages.length === 1)
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId('search_add')
								.setStyle(ButtonStyle.Success)
								.setDisabled(true)
								.setLabel(await getGuildLocale(interaction.guildId, 'MISC.ADD')),
							new ButtonBuilder()
								.setCustomId('cancel')
								.setStyle(ButtonStyle.Secondary)
								.setLabel(await getGuildLocale(interaction.guildId, 'MISC.CANCEL')),
						),
				],
				fetchReply: true,
			},
		);
		searchState[msg.id] = {};
		searchState[msg.id].pages = pages;
		searchState[msg.id].timeout = setTimeout(async message => {
			await message.edit(
				messageDataBuilder(
					new EmbedBuilder()
						.setDescription(await getGuildLocale(message.guildId, 'DISCORD.INTERACTION.EXPIRED')),
					{ components: [] },
				),
			);
			delete searchState[message.id];
		}, 30 * 1000, msg);
		searchState[msg.id].selected = [];
	},
};
