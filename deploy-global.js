require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const { applicationId, token } = require('./settings.json');
const clientId = process.env.BOT_CLIENT_ID || applicationId;
const botToken = process.env.BOT_TOKEN || token;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({
	version: '9',
}).setToken(botToken);

(async () => {
	console.log('Started refreshing application (/) commands globally');
	await rest.put(
		Routes.applicationCommands(clientId),
		{
			body: commands,
		},
	).then(() => {
		console.log('Successfully reloaded application (/) commands globally');
	}).catch((err) => {
		console.error(err);
	});
})();
