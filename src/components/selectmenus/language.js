import { ActionRowBuilder, EmbedBuilder, SelectMenuBuilder } from 'discord.js';
import { checkLocaleCompletion, getGuildLocale, messageDataBuilder, roundTo, settingsPage } from '#lib/util/util.js';
import { cachedDatabase, confirmationTimeout, data } from '#lib/util/common.js';
import { defaultLocale } from '#settings';
import { settingsOptions } from '#lib/util/constants.js';

export default {
	name: 'language',
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
		const localeCompletion = checkLocaleCompletion(option);
		if (localeCompletion === 'LOCALE_MISSING') return interaction.replyHandler.reply('That language does not exist.', { type: 'error' });
		await data.guild.set(interaction.guildId, 'settings.locale', option);
		if (localeCompletion.completion !== 100) {
			await interaction.replyHandler.reply(
				new EmbedBuilder()
					.setDescription(`This language is incomplete. Completion: \`${roundTo(localeCompletion.completion, 2)}%\`\nMissing strings:\n\`\`\`\n${localeCompletion.missing.join('\n')}\`\`\``),
				{ type: 'warning', ephemeral: true },
			);
		}
		const cdb = cachedDatabase.get(interaction.guildId);
		const guildLocale = cdb.settings.locale ?? defaultLocale;
		const { current, embeds, actionRow } = await settingsPage(interaction, guildLocale, 'language');
		const description = `${getGuildLocale(interaction.guildId, 'CMD.SETTINGS.RESPONSE.HEADER', interaction.guild.name)}\n\n**${getGuildLocale(interaction.guildId, 'CMD.SETTINGS.MISC.LANGUAGE.NAME')}** ─ ${getGuildLocale(interaction.guildId, 'CMD.SETTINGS.MISC.LANGUAGE.DESCRIPTION')}\n> ${getGuildLocale(interaction.guildId, 'MISC.CURRENT')}: \`${current}\``;
		const args = [
			[description, ...embeds],
			{
				components: [
					new ActionRowBuilder()
						.addComponents(
							SelectMenuBuilder.from(interaction.message.components[0].components[0])
								.setOptions(
									settingsOptions.map(opt => ({ label: getGuildLocale(interaction.guildId, `CMD.SETTINGS.MISC.${opt.toUpperCase()}.NAME`), description: getGuildLocale(interaction.guildId, `CMD.SETTINGS.MISC.${opt.toUpperCase()}.DESCRIPTION`), value: opt, default: opt === 'language' })),
								),
						),
					actionRow,
				],
			},
		];
		return localeCompletion.completion !== 100
			? interaction.message.edit(messageDataBuilder(...args))
			: interaction.replyHandler.reply(args[0], { ...args[1], force: 'update' });
	},
};
