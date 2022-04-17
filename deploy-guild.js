require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const clientId = process.env.BOT_CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.ts'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

async function deployGuild() {
	try {
		console.log(`Started refreshing application (/) commands to ${clientId}`);
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		).then(() => {
			console.log(`Successfully reloaded application (/) commands to ${clientId}`);
		});
	}
	catch (error) {
		console.error(error);
	}
}
deployGuild();
