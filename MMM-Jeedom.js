'use strict';

const isUserPresent = true;
Module.register("MMM-Jeedom", {
	isDebug: null,
	isLoaded: null,
	isModuleHidden: null,
	lastUpdate: null,
	isTemplateEnable: null,
	updateJeedomIntervalID: null,

	start: function() {
		this.isDebug = this.config.debug === true;
		this.debug('start', 'Module is started');

		moment.locale(this.config.language);
		this.title = "Loading...";
		this.isLoaded = false;
		this.isModuleHidden = false;
		this.lastUpdate = 0;
		this.updateJeedomIntervalID = setInterval(this.updateJeedom.bind(this), this.config.updateInterval || 10_000);

		this.sendSocketNotification("REGISTER_MODULE_MMM-Jeedom", this.config);

		// first update on start
		this.updateJeedom();
	},

	safeParseInt(str) {
		if (!str) {
			return null;
		}
		return parseInt(str, 0);
	},

	socketNotificationReceived: function(notification, payload) {
		this.debug('socketNotificationReceived', `Received a notification: ${notification}`);
		if (notification === `JEEDOM_FULL_CONFIG-${this.config.jeedomAPIKey}`) {
			this.updateSensorWithTemplates(payload);
		}
	},

	updateSensorWithTemplates(fullJeedomConfig) {
		for (const i in this.config.sensors) {
			if (this.config.sensors.hasOwnProperty(i)) {
				const sensor = this.config.sensors[i];
				if (sensor.template) {
					const jeedomObject = fullJeedomConfig.find(obj => obj.id == sensor.template.objectId);
					if (jeedomObject) {
						sensor.ids = jeedomObject.eqLogics
							.map(eqLogic => {
								const state = eqLogic.cmds.find(cmd => cmd.name === sensor.template.statusName);
								return {
									statusOnValue: state?.display.invertBinary == '1' ? '0' : '1',
									name: eqLogic.name,
									id: this.safeParseInt(state?.id),
									cmdIdOn: this.safeParseInt(eqLogic.cmds.find(cmd => cmd.name === sensor.template.cmdOnName)?.id),
									cmdIdOff: this.safeParseInt(eqLogic.cmds.find(cmd => cmd.name === sensor.template.cmdOffName)?.id),
								};
							})
							.filter(s => s.name && s.id);
					}
				}
			}
		}
		this.updateDom();
		this.updateJeedom();
	},

	suspend: function() { //fct core appelée quand le module est caché
		this.isModuleHidden = true; //Il aurait été plus propre d'utiliser this.hidden, mais comportement aléatoire...
		this.debug("suspend", `isModuleHidden=${this.isModuleHidden}`);
		this.updateJeedomInterval(); //on appele la fonction qui gere tous les cas
	},

	resume: function() { //fct core appelée quand le module est affiché
		this.isModuleHidden = false;
		this.debug("resume", `isModuleHidden=${this.isModuleHidden}`);
		this.updateJeedomInterval();
	},

	updateJeedomInterval: function() {
		this.debug("updateJeedomInterval", `isUserPresent:${this.isUserPresent} > isModuleHidden:${this.isModuleHidden}`);
		if (isUserPresent === true && this.isModuleHidden === false) {
			this.debug("updateJeedomInterval", `${this.name} est revenu !`);

			// update tout de suite
			this.updateJeedom();
			if (!this.updateJeedomIntervalID) {
				this.updateJeedomIntervalID = setInterval(this.updateJeedom.bind(this), this.config.updateInterval || 10_000);
			}
		} else {
			// (isUserPresent = false OU ModuleHidden = true)
			this.debug("updateJeedomInterval", `Personne regarde, on stop les update !`);
			this.IntervalID = clearInterval(this.updateJeedomIntervalID);
		}
	},

	getStyles: function() {
	    return ['font-awesome.css', this.file(`./css/MMM-Jeedom.css`)];
	},

	getDom: function() {
		const wrapper = document.createElement("div");
		if (!this.isLoaded) {
			wrapper.innerHTML = `<div class="dimmed light small">Loading...</div>`;
			return wrapper;
		}

		const htmlRows = [];
		for (const i in this.config.sensors) {
			if (this.config.sensors.hasOwnProperty(i)) {
				const sensor = this.config.sensors[i];
				const sensorVisual = sensor.visual;
				for (const j in sensor.ids) {
					if (sensor.ids.hasOwnProperty(j)) {
						const sensorId = sensor.ids[j];
						const valueToMatch = sensorId.statusOnValue !== undefined ? sensorId.statusOnValue : '1';
						const isSensorOn = sensorId._status == valueToMatch;
						this.debug(sensorId.name, `${sensorId._status}==${valueToMatch}=${isSensorOn}`)

						let sensorIcon = sensorVisual.icon;
						if (sensorVisual.iconOn && sensorVisual.iconOff) {
							if (sensorId._status !== undefined) {
								sensorIcon = isSensorOn ? sensorVisual.iconOn : sensorVisual.iconOff;
							} else {
								sensorIcon = 'fas fa-circle-notch rotate';
							}
						}

						let sensorName = sensorId.name;
						if (sensorId.nameOn && sensorId.nameOff) {
							sensorName = isSensorOn ? sensorId.nameOn : sensorId.nameOff;
						}

						let sensorStatus = '';
						if (!sensorVisual.hideStatus) {
							sensorStatus = sensorId._status;
							if (sensorVisual.unit) {
								sensorStatus += ` ${sensorVisual.unit}`;
							}
						}

						let sensorValue = '';
						if (sensorId.valueId) {
							sensorValue = sensorId._value;
							if (sensorVisual.valueUnit) {
								sensorValue += ` ${sensorVisual.valueUnit}`;
							}
						}

						let sensorAction = '';
						if (sensorId.cmdIdOn && sensorId.cmdIdOff) {
							if (isSensorOn) {
								sensorAction = `<i class="${sensorVisual.cmdIconOn}" data-cmd="${sensorId.cmdIdOn}"></i>`;
							} else {
								sensorAction = `<i class="${sensorVisual.cmdIconOff}" data-cmd="${sensorId.cmdIdOff}"></i>`;
							}
						}

						htmlRows.push(`
						<tr class="normal">
							<td class="symbol align-left"><i class="${sensorIcon}"></i></td>
							<td class="title bright align-left">${sensorName}</td>
							<td class="time light align-right">${sensorStatus} ${sensorValue}</td>
							<td class="time light align-right">${sensorAction}</td>
						</tr>
					`);
					}
				}
			}
		}

		let lastDate = '';
		if (this.config.displayLastUpdate) {
			lastDate = `
				<div class="xsmall light align-left" style="text-align: center; margin-top: 7px;">
					(${moment.unix(this.lastUpdate).format('dddd - HH:mm:ss')})
				</div>
			`;
		}

		wrapper.innerHTML = `<table class="small" style="min-width: 400px;">${htmlRows.join('')}</table>${lastDate}`;
		wrapper.addEventListener("click", this.onClick.bind(this));
		return wrapper;
	},

	onClick: function(event) {
		event.stopPropagation();
		const dataCmdActionId = event.target.getAttribute('data-cmd');
		if (dataCmdActionId) {
			event.target.parentNode.parentNode.className = 'loading';
			event.target.className = 'fas fa-circle-notch rotate';
			this.askJeedomStatuses([this.safeParseInt(dataCmdActionId)], () => {
				// sensors may not have been updated yet on Jeedom
				// this.updateJeedom();
			})
		}
	},

	updateJeedom: function() {
		this.lastUpdate = Date.now() / 1000 ;

		const ids = [];
		for (const i in this.config.sensors) {
			if (this.config.sensors.hasOwnProperty(i)) {
				const sensor = this.config.sensors[i];
				for (const j in sensor.ids) {
					if (sensor.ids.hasOwnProperty(j)) {
						const sensorId = sensor.ids[j];
						ids.push(sensorId.id);
						if (sensorId.valueId) {
							ids.push(sensorId.valueId);
						}
					}
				}
			}
		}

		this.askJeedomStatuses(ids, (payload) => {
			for (const i in this.config.sensors) {
				if (this.config.sensors.hasOwnProperty(i)) {
					const sensor = this.config.sensors[i];
					for (const j in sensor.ids) {
						if (sensor.ids.hasOwnProperty(j)) {
							const sensorId = sensor.ids[j];
							sensorId._status = payload[sensorId.id];
							sensorId._value = payload[sensorId.valueId];
						}
					}
				}
			}
			this.isLoaded = true;
			this.updateDom();
		});
	},

	doGet: function(url, callback, nbRetryLeft = 3) {
		this.debug('doGet', url);
		const req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.timeout = 500;
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.onreadystatechange = () => {
			if (req.readyState === 4) {
				if (req.status === 0 && nbRetryLeft > 0) {
					// request may fail because of Jeedom load. Retry 3 times
					this.doGet(url, callback, nbRetryLeft - 1);
				} else if (req.status === 200 && callback) {
					callback(JSON.parse(req.responseText));
				}
			}
		};
		req.send(null);
	},

	askJeedomStatuses: function(ids, callback) {
		const schema = this.config.jeedomHttps ? "https" : "http";
		const port = this.config.jeedomPort ? this.config.jeedomPort : 443;
		const url = `${schema}://${this.config.jeedomUrl}:${port}/core/api/jeeApi.php?apikey=${this.config.jeedomAPIKey}&type=cmd&id=${JSON.stringify(ids)}&_=${+new Date()}`;
		this.doGet(url, callback)
	},

	debug: function (fct, message) {
		if (this.isDebug === true) {
			Log.log(`%c[${this.name}]%c[${fct}]%c ${message}`, 'background:#5eba7d;color:white;', 'background:#0a95ff;color:white', 'color:black');
		}
	},
});
