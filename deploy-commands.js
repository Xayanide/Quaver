// To be run once.
// Commands are deployed globally by default.
// This means that it may take a little bit of time before your commands can be seen on all guilds.

require('dotenv').config();
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { applicationId, token } = require('./settings.json');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN || token);

(async () => {
	try {
		await rest.put(
			Routes.applicationCommands(process.env.BOT_CLIENT_ID || applicationId),
			{ body: commands },
		);
		console.log('Successfully registered application commands.');
	}
	catch (error) {
		console.error(error);
	}
})();
