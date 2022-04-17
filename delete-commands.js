// To be run once.
require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { applicationId, token } = require('./settings.json');

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN || token);

(async () => {
	const data = await rest.get(Routes.applicationCommands(process.env.BOT_CLIENT_ID || applicationId));
	const promises = [];
	for (const command of data) {
		const deleteUrl = `${Routes.applicationCommands(applicationId)}/${command.id}`;
		promises.push(rest.delete(deleteUrl));
	}
	return Promise.all(promises);
})();
