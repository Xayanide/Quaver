// import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

import { applicationId, token } from '#settings';
const clientId = process.env.BOT_CLIENT_ID || applicationId;
const guildId = process.env.GUILD_ID;
const botToken = process.env.BOT_TOKEN || token;

const rest = new REST({ version: '10' }).setToken(botToken);

(async () => {
	const data = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
	const promises = [];
	console.log(`Started deleting application (/) commands for guild ${guildId}`);
	for (const command of data) {
		const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
		promises.push(rest.delete(deleteUrl));
	}
	Promise.all(promises).then(() => {
		console.log(`Deleted application (/) commands for guild ${guildId}`);
	}).catch((err) => {
		console.error(err);
	});
})();
