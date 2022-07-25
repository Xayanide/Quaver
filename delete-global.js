require('dotenv/config');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { applicationId, token } = require('./settings.json');
const clientId = process.env.BOT_CLIENT_ID || applicationId;
const botToken = process.env.BOT_TOKEN || token;

const rest = new REST({
	version: '9',
}).setToken(botToken);

(async () => {
	const data = await rest.get(Routes.applicationCommands(clientId));
	const promises = [];
	console.log('Started deleting application (/) commands globally');
	for (const command of data) {
		const deleteUrl = `${Routes.applicationCommands(clientId)}/${command.id}`;
		promises.push(rest.delete(deleteUrl));
	}
	Promise.all(promises).then(() => {
		console.log('Deleted application (/) commands globally');
	}).catch((err) => {
		console.error(err);
	});
})();
