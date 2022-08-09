// To be run once.

// import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { token, applicationId } from '#settings';

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN || token);

(async () => {
	const data = await rest.get(Routes.applicationCommands(process.env.BOT_CLIENT_ID || applicationId));
	const promises = [];
	for (const command of data) {
		const deleteUrl = `${Routes.applicationCommands(process.env.BOT_CLIENT_ID || applicationId)}/${command.id}`;
		promises.push(rest.delete(deleteUrl));
	}
	return Promise.all(promises);
})();
