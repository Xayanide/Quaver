require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const clientId = process.env.BOT_CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

const rest = new REST({ version: '9' }).setToken(token);

async function deleteGuild() {
	const data = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
	const promises = [];
	console.log(`Started deleting application (/) commands for ${clientId}`);
	for (const command of data) {
		const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
		promises.push(rest.delete(deleteUrl));
	}
	Promise.all(promises);
	console.log(`Deleted application (/) commands for ${clientId}`);
	return;
}
deleteGuild();
