const NodeHelper = require("node_helper");
const Log = require("logger");
const fetch = require("node-fetch");

module.exports = NodeHelper.create({
	jeedomConfigs: [],

	start: function() {
		setInterval(this.updateConfigTemplates.bind(this), 1_500);
		setInterval(this.updateConfigTemplatesFull.bind(this), 60_000);
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'REGISTER_MODULE_MMM-Jeedom') {
			const existingJeedomConfig = this.jeedomConfigs.find(cfg => cgf.apiKey === payload.jeedomAPIKey);
			// this check doesn't work as all MMM-Jeedom modules send a message in the same time
			if (!existingJeedomConfig) {
				this.jeedomConfigs[payload.jeedomAPIKey] = {
					isUpdated: true,
					apiKey: payload.jeedomAPIKey,
					url: payload.jeedomUrl,
					port: payload.jeedomPort,
					https: payload.jeedomHttps,
				};
			} else {
				this.sendSocketNotification(`JEEDOM_FULL_CONFIG-${existingJeedomConfig.apiKey}`, existingJeedomConfig);
			}
		}
	},

	// duplicate fonction
	doGet: function(url, callback) {
		const headers = {
			"Content-type": "application/x-www-form-urlencoded",
		};
		fetch(url, { headers: headers })
			.then(response => response.json())
			.then(payload => callback(payload))
			.catch((error) => {
				Log.error(error);
			});
	},

	// duplicate fonction
	safeParseInt(str) {
		if (!str) {
			return null;
		}
		return parseInt(str, 0);
	},

	updateConfigTemplates: function(skipIsUpdate = false) {
		for (const i in this.jeedomConfigs) {
			if (this.jeedomConfigs.hasOwnProperty(i)) {
				const jeedomConfig = this.jeedomConfigs[i];
				if (jeedomConfig.isUpdated || skipIsUpdate) {
					this.updateConfigTemplate(jeedomConfig);
					jeedomConfig.isUpdated = false;
				}
			}
		}
	},

	updateConfigTemplatesFull: function() {
		this.updateConfigTemplates(true);
	},

	updateConfigTemplate: function(jeedomConfig) {
		const schema = jeedomConfig.https ? "https" : "http";
		const port = jeedomConfig.jeedomPort ? jeedomConfig.jeedomPort : 443;
		const url = `${schema}://${jeedomConfig.url}:${port}/core/api/jeeApi.php?apikey=${jeedomConfig.apiKey}&type=fullData&_=${+new Date()}`;
		this.doGet(url, payload => {
			this.sendSocketNotification(`JEEDOM_FULL_CONFIG-${jeedomConfig.apiKey}`, payload);
		})
	}
});



