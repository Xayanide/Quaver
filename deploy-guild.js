import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { applicationId, token } from '#settings';
import { getAbsoluteFileURL } from '#lib/util/util.js';
import { setLocales } from '#lib/util/common.js';
const clientId = process.env.BOT_CLIENT_ID || applicationId;
const guildId = process.env.GUILD_ID;
const botToken = process.env.BOT_TOKEN || token;

const locales = new Collection();
const localeFolders = readdirSync(getAbsoluteFileURL(import.meta.url, ['..', 'locales']));
for await (const folder of localeFolders) {
	const localeFiles = readdirSync(getAbsoluteFileURL(import.meta.url, ['..', 'locales', folder]));
	const localeData = {};
	for await (const file of localeFiles) {
		const locale = await import(getAbsoluteFileURL(import.meta.url, ['..', 'locales', folder, file]));
		localeData[file.split('.')[0].toUpperCase()] = locale.default;
	}
	locales.set(folder, localeData);
}
setLocales(locales);

const commands = [];
const commandFiles = readdirSync(getAbsoluteFileURL(import.meta.url, ['..', 'src', 'commands'])).filter(file => file.endsWith('.js'));

for await (const file of commandFiles) {
	const command = await import(getAbsoluteFileURL(import.meta.url, ['..', 'src', 'commands', file]));
	commands.push(command.default.data.toJSON());
}

const rest = new REST({
	version: '10',
}).setToken(botToken);

(async () => {
	console.log(`Started refreshing application (/) commands for guild ${guildId}`);
	await rest.put(
		Routes.applicationGuildCommands(clientId, guildId),
		{
			body: commands,
		},
	).then(() => {
		console.log(`Successfully reloaded application (/) commands for guild ${guildId}`);
	}).catch((err) => {
		console.error(err);
	});
})();
