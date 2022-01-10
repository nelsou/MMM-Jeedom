'use strict';

const isUserPresent = true;

Module.register("MMM-Jeedom", {
	start: function() {
		this.debug('start', 'Module is started');
		this.isDebug = true;

		moment.locale(config.language);
		this.title = "Loading...";
		this.isLoaded = false;
		this.isModuleHidden = false;
		this.lastUpdate = 0;

		this.IntervalID = setInterval(this.updateJeedom.bind(this), this.config.updateInterval || 10_000);
		this.sensors = this.config.sensors || this.defaults.sensors;

		// first update on start
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

	notificationReceived: function(notification, payload, sender) {
		this.debug("notificationReceived", notification);
		if (notification === "USER_PRESENCE") { // notification envoyée par le module MMM-PIR-Sensor. Voir sa doc
			this.isUserPresent = payload;
			this.updateJeedomInterval();
		}
	},

	updateJeedomInterval: function() {
		this.debug("updateJeedomInterval", `isUserPresent:${this.isUserPresent} > isModuleHidden:${this.isModuleHidden}`);
		if (isUserPresent === true && this.isModuleHidden === false) {
			this.debug("updateJeedomInterval", `${this.name} est revenu. updateJeedom !`);

			// update tout de suite
			this.updateJeedom();
			if (this.IntervalID === 0) {
				this.IntervalID = setInterval(this.updateJeedom.bind(this), this.config.updateInterval || this.defaults.updateInterval);
			}
		} else { //sinon (isUserPresent = false OU ModuleHidden = true)
			this.debug("updateJeedomInterval", `Personne regarde, on stop l'update ${this.IntervalID}`);
			clearInterval(this.IntervalID);
			this.IntervalID = 0;
		}
	},

	getStyles: function() {
	    return ['font-awesome.css'];
	},

	// Override dom generator.
	getDom: function() {
		const wrapper = document.createElement("div");
		if (!this.isLoaded) {
			wrapper.innerHTML = `<div class="dimmed light small">Loading...</div>`;
			return wrapper;
		}

		const htmlRows = [];
		for (const i in this.sensors) {
			if (this.sensors.hasOwnProperty(i)) {
				const sensor = this.sensors[i];
				const isSensorOn = (sensor._status === 1 || sensor._status === '1');

				let sensorSymbol = sensor.icon;
				if (sensor.iconOn && sensor.iconOff) {
					sensorSymbol = isSensorOn ? sensor.iconOn : sensor.iconOff;
				}

				let sensorTitle = sensor.title;
				if (sensor.titleOn && sensor.titleOff) {
					sensorTitle = isSensorOn ? sensor.titleOn : sensor.titleOff;
				}

				let sensorStatus = '';
				if (sensor.status?.display) {
					if (sensor.status.iconOn && sensor.status.iconOff) {
						sensorStatus = isSensorOn ? sensor.status.iconOn : sensor.status.iconOff;
					} else {
						sensorStatus = sensor._status;
						if (sensor.status.unit) {
							sensorStatus += ` ${sensor.status.unit}`;
						}
					}
				}

				let sensorValue = '';
				if (sensor.value?.display) {
					sensorStatus = sensor._value;
					if (sensor.value.unit) {
						sensorStatus += ` ${sensor.value.unit}`;
					}
				}

				let sensorAction = '';
				if (sensor.action?.iconOn && sensor.action?.iconOff) {
					if (isSensorOn) {
						sensorAction = `<i class="${sensor.action.iconOn}" data-cmd="${sensor.action.cmdIdOn}"></i>`;
					} else {
						sensorAction = `<i class="${sensor.action.iconOff}" data-cmd="${sensor.action.cmdIdOff}"></i>`;
					}
				}

				htmlRows.push(`
					<tr class="normal">
						<td class="symbol align-left"><i class="${sensorSymbol}"></i></td>
						<td class="title bright align-left">${sensorTitle}</td>
						<td class="time light align-right">${sensorStatus}</td>
						<td class="time light align-right">${sensorValue}</td>
						<td class="time light align-right">${sensorAction}</td>
					</tr>
				`);
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

		wrapper.innerHTML = `<table class="small">${htmlRows.join('')}</table>${lastDate}`;
		wrapper.addEventListener("click", this.onClick.bind(this));
		return wrapper;
	},

	onClick: function(event) {
		event.stopPropagation();
		const dataCmdActionId = event.target.getAttribute('data-cmd');
		if (dataCmdActionId) {
			this.askJeedomStatuses([dataCmdActionId], () => {
				// sensors may not have been updated yet on Jeedom
				this.updateJeedom();
			})
		}
	},

	updateJeedom: function() {
		this.lastUpdate = Date.now() / 1000 ;

		this.askJeedomStatuses(this.sensors.map(sensor => sensor.idx), (payload) => {
			for (const i in this.sensors) {
				if (this.sensors.hasOwnProperty(i)) {
					const sensor = this.sensors[i];
					if (payload[sensor.idx] != null) {
						sensor._status = payload[sensor.idx];
					}
					if (payload[sensor.value?.idx] != null) {
						sensor._value = payload[sensor.value.idx];
					}
				}
			}
			this.isLoaded = true;
			this.updateDom();
		});
	},

	doGet: function(url, callback) {
		const req = new XMLHttpRequest();
		this.debug('doGet', url)
		req.open("GET", url, true);
		req.timeout = 500;
		req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		req.onreadystatechange = function() {
			if (req.readyState === 4 && req.status === 200) {
				if (callback) {
					callback(JSON.parse(req.responseText));
				}
			}
		};
		req.send(null);
	},

	askJeedomStatuses: function(ids, callback) {
		const schema = this.config.jeedomHTTPS ? "https" : "http";
		const url = `${schema}://${this.config.jeedomURL}${this.config.jeedomAPIPath}?apikey=${this.config.jeedomAPIKey}&type=cmd&id=${JSON.stringify(ids)}`;
		this.doGet(url, callback)
	},

	debug: function (fct, message) {
		if (this.isDebug === true) {
			Log.log(`[${this.name}][${fct}] ${message}`);
		}
	},
});
