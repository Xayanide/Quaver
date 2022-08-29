import { ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { paginate, msToTime, msToTimeString, getGuildLocale } from '#lib/util/util.js';

export default {
	name: 'queue',
	/** @param {import('discord.js').ButtonInteraction & {client: import('discord.js').Client & {music: import('lavaclient').Node}}} interaction */
	async execute(interaction) {
		const player = interaction.client.music.players.get(interaction.guildId), pages = player ? paginate(player.queue.tracks, 5) : [];
		let page = interaction.customId.split('_')[1];
		if (player && page === 'goto' && pages.length !== 0) {
			return interaction.showModal(
				new ModalBuilder()
					.setTitle(await getGuildLocale(interaction.guildId, 'CMD.QUEUE.MISC.MODAL_TITLE'))
					.setCustomId('queue_goto')
					.addComponents(
						new ActionRowBuilder()
							.addComponents(
								new TextInputBuilder()
									.setCustomId('queue_goto_input')
									.setLabel(await getGuildLocale(interaction.guildId, 'CMD.QUEUE.MISC.PAGE'))
									.setStyle(TextInputStyle.Short),
							),
					),
			);
		}
		page = parseInt(page);
		if (!player || pages.length === 0 || page < 1 || page > pages.length) return interaction.replyHandler.locale('CMD.QUEUE.RESPONSE.QUEUE_EMPTY', { type: 'error', components: [], force: 'update' });
		const firstIndex = 5 * (page - 1) + 1;
		const pageSize = pages[page - 1].length;
		const largestIndexSize = (firstIndex + pageSize - 1).toString().length;
		const original = { embeds: interaction.message.embeds, components: interaction.message.components };
		if (original.embeds.length === 0) return interaction.message.delete();
		original.embeds[0] = EmbedBuilder.from(original.embeds[0])
			.setDescription(pages[page - 1].map((track, index) => {
				const duration = msToTime(track.length);
				const durationString = track.isStream ? '∞' : msToTimeString(duration, true);
				return `\`${(firstIndex + index).toString().padStart(largestIndexSize, ' ')}.\` **[${track.title.length >= 50 ? `${track.title.substring(0, 47)}...` : track.title}](${track.uri})** \`[${durationString}]\` <@${track.requester}>`;
			}).join('\n'))
			.setFooter({ text: await getGuildLocale(interaction.guildId, 'MISC.PAGE', page, pages.length) });
		original.components[0] = ActionRowBuilder.from(original.components[0]);
		original.components[0].components = [];
		original.components[0].components[0] = new ButtonBuilder()
			.setCustomId(`queue_${page - 1}`)
			.setEmoji('⬅️')
			.setDisabled(page - 1 < 1)
			.setStyle(ButtonStyle.Primary);
		original.components[0].components[1] = new ButtonBuilder()
			.setCustomId('queue_goto')
			.setStyle(ButtonStyle.Secondary)
			.setLabel(await getGuildLocale(interaction.guildId, 'MISC.GO_TO')),
		original.components[0].components[2] = new ButtonBuilder()
			.setCustomId(`queue_${page + 1}`)
			.setEmoji('➡️')
			.setDisabled(page + 1 > pages.length)
			.setStyle(ButtonStyle.Primary);
		return interaction.replyHandler.reply(original.embeds, { components: original.components, force: 'update' });
	},
};
