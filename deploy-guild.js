require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const { applicationId, token } = require('./settings.json');
const clientId = process.env.BOT_CLIENT_ID || applicationId;
const guildId = process.env.GUILD_ID;
const botToken = process.env.BOT_TOKEN || token;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.ts'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(botToken);

(async () => {
	console.log(`Started refreshing application (/) commands for guild ${guildId}`);
	await rest.put(
		Routes.applicationGuildCommands(clientId, guildId),
		{ body: commands },
	).then(() => {
		console.log(`Successfully reloaded application (/) commands for guild ${guildId}`);
	}).catch((err) => {
		console.error(err);
	});
})();
