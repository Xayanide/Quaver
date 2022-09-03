import { ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { getGuildLocale, messageDataBuilder, settingsPage } from '#lib/util/util.js';
import { cachedDatabase, confirmationTimeout, data } from '#lib/util/common.js';
import { defaultLocale } from '#settings';

export default {
	name: 'format',
	async execute(interaction) {
		if (interaction.message.interaction.user.id !== interaction.user.id) return interaction.replyHandler.locale('DISCORD.INTERACTION.USER_MISMATCH', { type: 'error' });
		if (!confirmationTimeout[interaction.message.id]) return interaction.replyHandler.locale('DISCORD.INTERACTION.EXPIRED', { components: [], force: 'update' });
		clearTimeout(confirmationTimeout[interaction.message.id]);
		confirmationTimeout[interaction.message.id] = setTimeout(async message => {
			await message.edit(
				messageDataBuilder(
					new EmbedBuilder()
						.setDescription(getGuildLocale(message.guildId, 'DISCORD.INTERACTION.EXPIRED')),
					{ components: [] },
				),
			);
			delete confirmationTimeout[message.id];
		}, 30 * 1000, interaction.message);
		const option = interaction.customId.split('_')[1];
		await data.guild.set(interaction.guildId, 'settings.format', option);
		const cdb = cachedDatabase.get(interaction.guildId);
		const guildLocale = cdb.settings.locale ?? defaultLocale;
		const { current, embeds, actionRow } = await settingsPage(interaction, guildLocale, 'format');
		const description = `${getGuildLocale(interaction.guildId, 'CMD.SETTINGS.RESPONSE.HEADER', interaction.guild.name)}\n\n**${getGuildLocale(interaction.guildId, 'CMD.SETTINGS.MISC.FORMAT.NAME')}** ─ ${getGuildLocale(interaction.guildId, 'CMD.SETTINGS.MISC.FORMAT.DESCRIPTION')}\n> ${getGuildLocale(interaction.guildId, 'MISC.CURRENT')}: \`${current}\``;
		return interaction.replyHandler.reply(
			[description, ...embeds],
			{
				components: [
					new ActionRowBuilder()
						.addComponents(interaction.message.components[0].components[0]),
					actionRow,
				],
				force: 'update',
			},
		);
	},
};
