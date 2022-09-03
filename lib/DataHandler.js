import { Collection } from 'discord.js';
import Keyv from 'keyv';
import { get as _get, set as _set } from 'lodash-es';
import { localCache } from './util/common.js';

/** Class for handling data through Keyv. */
export default class DataHandler {
	/**
	 * Create an instance of DataHandler, also creating a database connection.
	 * @param {{cache: string, namespace: string}} opts The options to pass to Keyv.
	 */
	constructor(opts) {
		this.cache = new Keyv({
			uri: opts.cache,
			namespace: opts.namespace,
		});
		this.localCache = new Collection();
		this.schema = {
			settings: {
				stay: {
					channel: '',
					text: '',
					enabled: false,
				},
				locale: 'en',
			},
		};
	}

	/**
	 * @typedef {Object} StayOptions
	 * @property {boolean} enabled - Whether or not 24/7 is enabled.
	 * @property {string} channel - The bound voice or stage channel.
	 * @property {string} text - The bound text channel.
	 */

	/**
	 * @typedef {Object} Values
	 * @property {Object} settings
	 * @property {StayOptions} settings.stay
	 * @property {string} settings.locale - The locale used in the server.
	 */

	/**
	 * Get an item from the database by its key.
	 * @param {string} key The key.
	 * @param {string} item The item to retrieve.
	 * @returns {Promise<string|boolean|undefined>} The requested item.
	 */
	async get(key, item) {
		const localData = localCache.get(key);
		if (localData) {
			console.log('get local cache data');
			return _get(localData, item);
		}
		console.log('get cache data');
		/** @type {Values} */
		const data = await this.cache.get(key);
		if (!data) await this.cache.set(key, this.preset);
		this.localCache.set(key, data);
		return _get(data, item);
	}

	/**
	 * Set an item in the database by its key.
	 * @param {string} key The key.
	 * @param {string} item The item to set.
	 * @param {string|boolean} value The value to set.
	 * @returns {Promise<true>} The updated item.
	 */
	async set(key, item, value) {
		/** @type {Values} */
		let data = await this.cache.get(key);
		if (!data) data = {};
		this.localCache.set(key, _set(data, item, value));
		return this.cache.set(key, _set(data, item, value));
	}

	/**
	 * Get the Keyv instance used by this DataHandler.
	 * @returns {Keyv} The Keyv instance.
	 */
	get instance() {
		return this.cache;
	}
}
