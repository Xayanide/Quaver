import { logger } from '#lib/util/common.js';

export default {
	name: 'debug',
	once: false,
	/** @param {string} */
	async execute(message) {
		if (!process.argv[2]?.includes('--debug')) return;
		const { shuttingDown } = await import('#src/main.js');
		if (message.includes('Provided token')) message = '';
		console.log(message);
		if (message.includes('429') || /429/g.test(message)) {
			logger.error({ message: 'An error occurred. Quaver will now shut down to prevent any further issues.', label: 'Discord' });
			logger.error({ message: `${message}`, label: 'Discord' });
			await shuttingDown('discord', new Error('429'));
		}
	},
};
