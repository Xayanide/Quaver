import { logger } from '#lib/util/common.js';

export default {
	name: 'debug',
	once: false,
	/** @param {string} */
	async execute(message) {
		const { shuttingDown } = await import('#src/main.js');
		if (message.includes('Provided token')) message = '';
		if (process.argv?.includes('--debug')) console.log(message);
		if (message.includes('429 hit on route /')) {
			logger.error({ message: 'An error occurred. Quaver will now shut down to prevent any further issues.', label: 'Discord' });
			logger.error({ message: `${message}`, label: 'Discord' });
			await shuttingDown('discord', new Error('429 hit on route'));
		}
	},
};
