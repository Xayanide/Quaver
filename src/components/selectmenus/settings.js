import { ActionRowBuilder, EmbedBuilder, SelectMenuBuilder } from 'discord.js';
import { getGuildLocale, messageDataBuilder, settingsPage } from '#lib/util/util.js';
import { settingsOptions } from '#lib/util/constants.js';
import { cachedDatabase, confirmationTimeout } from '#lib/util/common.js';
import { defaultLocale } from '#settings';

export default {
	name: 'settings',
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
		const option = interaction.values[0];
		const cdb = cachedDatabase.get(interaction.guildId);
		const guildLocale = cdb.settings.locale ?? defaultLocale;
		const { current, embeds, actionRow } = await settingsPage(interaction, guildLocale, option);
		const description = `${getGuildLocale(interaction.guildId, 'CMD.SETTINGS.RESPONSE.HEADER', interaction.guild.name)}\n\n**${getGuildLocale(interaction.guildId, `CMD.SETTINGS.MISC.${option.toUpperCase()}.NAME`)}** ─ ${getGuildLocale(interaction.guildId, `CMD.SETTINGS.MISC.${option.toUpperCase()}.DESCRIPTION`)}\n> ${getGuildLocale(interaction.guildId, 'MISC.CURRENT')}: \`${current}\``;
		return interaction.replyHandler.reply(
			[description, ...embeds],
			{
				components: [
					new ActionRowBuilder()
						.addComponents(
							new SelectMenuBuilder()
								.setCustomId('settings')
								.addOptions(
									settingsOptions.map(opt => ({ label: getGuildLocale(interaction.guildId, `CMD.SETTINGS.MISC.${opt.toUpperCase()}.NAME`), description: getGuildLocale(interaction.guildId, `CMD.SETTINGS.MISC.${opt.toUpperCase()}.DESCRIPTION`), value: opt, default: opt === option })),
								),
						),
					actionRow,
				],
				force: 'update',
			},
		);
	},
};
