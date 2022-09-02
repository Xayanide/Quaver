import { PermissionsBitField } from 'discord.js';
import { logger } from '#lib/util/common.js';
import { getGuildLocale, buildMessageOptions } from '#lib/util/util.js';

/** Class for handling replies to interactions. */
export default class ReplyHandler {
	/**
	 * Create an instance of ReplyHandler.
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction The discord.js ChatInputCommandInteraction object.
	 */
	constructor(interaction) {
		this.interaction = interaction;
	}

	/**
	 * Replies with a message.
	 * @param {string|EmbedBuilder|string[]|EmbedBuilder[]} msgData The data to be used. Can be a string, EmbedBuilder, or an array of either.
	 * @param {import('discord.js').MessageOptions & import('discord.js').MessagePayload & import('discord.js').InteractionReplyOptions & import('discord.js').WebhookEditMessageOptions & {type?: "success"|"neutral"|"warning"|"error"}} optionals Extra data, such as type or components.
	 * @returns {Promise<import('discord.js').Message|false>} The message that was sent.
	 */
	async reply(msgData, { type = 'neutral', components = null, files = null } = {}) {
		/** @type {string & import('discord.js').MessageOptions & import('discord.js').MessagePayload & import('discord.js').InteractionReplyOptions & import('discord.js').WebhookEditMessageOptions} */
		const messageOptions = buildMessageOptions(msgData, { type, components, files });
		if (!this.interaction.replied && !this.interaction.deferred) {
			if (type === 'error' || this.interaction.channel && !this.interaction.channel.permissionsFor(this.interaction.client.user.id).has(new PermissionsBitField([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]))) {
				messageOptions.ephemeral = true;
			}
			try {
				return await this.interaction.reply(messageOptions);
			}
			catch (err) {
				logger.error({ message: `${err.message}\n${err.stack}`, label: 'Quaver' });
				return false;
			}
		}
		try {
			return await this.interaction.editReply(messageOptions);
		}
		catch (err) {
			logger.error({ message: `${err.message}\n${err.stack}`, label: 'Quaver' });
			return false;
		}
	}

	/**
	 * Replies with a localized message.
	 * @param {string} code The code of the locale string to be used.
	 * @param {{type?: "success"|"neutral"|"warning"|"error", args?: string[], components?: import('discord.js').ActionRowBuilder[], files?: import('discord.js').Attachment[]}} optionals Extra data, such as type or components.
	 * @returns {Promise<import('discord.js').Message|boolean>} The message that was sent.
	 */
	async locale(code, { args = [], type = 'neutral', components = null, files = null } = {}) {
		return this.reply(await getGuildLocale(this.interaction.guildId, code, ...args), { type, components, files });
	}
}
