'use strict';

//pour gerer le PIR et le module.hidden en meme temps
const isUserPresent = true; // par défaut on est présent (pas de sensor PIR pour couper)

Module.register("MMM-Jeedom",{
	// Default module config.
	defaults: {
		jeedomHTTPS: true,
		updateInterval: 10000, // 10s
		animationSpeed: 1000,
		displayLastUpdate: true,
		displayLastUpdateFormat: 'dddd - HH:mm:ss',
		sensors: [],
	},

	start: function() {
		Log.log('LOG' + this.name + ' is started!');

		moment.locale(config.language);
		this.title = "Loading...";
		this.loaded = false;
		this.isModuleHidden = false; // par défaut on affiche le module (si pas de module carousel ou autre pour le cacher)
		this.lastUpdate = 0;

		var self = this;
		this.IntervalID = setInterval(function() { self.updateJeedom(); }, this.config.updateInterval);
		this.sensors = this.config.sensors;

		// first update on start
		this.updateJeedom();
	},

	suspend: function() { //fct core appelée quand le module est caché
		this.isModuleHidden = true; //Il aurait été plus propre d'utiliser this.hidden, mais comportement aléatoire...
		console.log("suspend >> ModuleHidden = " + this.isModuleHidden);
		this.updateJeedomInterval(); //on appele la fonction qui gere tous les cas
	},

	resume: function() { //fct core appelée quand le module est affiché
		this.isModuleHidden = false;
		console.log("resume >> ModuleHidden = " + this.isModuleHidden);
		this.updateJeedomInterval();
	},

	// notificationReceived: function(notification, payload, sender) {
	// 	console.log("Fct notif notif !!! " + notification);
	// 	if (notification === "USER_PRESENCE") { // notification envoyée par le module MMM-PIR-Sensor. Voir sa doc
	// 		console.log("Fct notificationReceived USER_PRESENCE - payload = " + payload);
	// 		isUserPresent = payload;
	// 		this.updateJeedomInterval();
	// 	}
	// },

	updateJeedomInterval: function() {
		console.log(`updateJeedomInterval >> ${this.isUserPresent} > ${this.isModuleHidden}`);
		if (isUserPresent === true && this.isModuleHidden === false) { // on s'assure d'avoir un utilisateur présent devant l'écran (sensor PIR) et que le module soit bien affiché
			console.log(`updateJeedomInterval > ${this.name} est revenu. updateJeedom !`);

			// update tout de suite
			this.updateJeedom();
			if (this.IntervalID === 0) {
				var self = this;
				this.IntervalID = setInterval(function() { self.updateJeedom(); }, this.config.updateInterval);
			}
		}else{ //sinon (isUserPresent = false OU ModuleHidden = true)
			console.log(`updateJeedomInterval > Personne regarde, on stop l'update ${this.IntervalID}`);
			clearInterval(this.IntervalID); // on arrete l'intervalle d'update en cours
			this.IntervalID=0; //on reset la variable
		}
	},

	getStyles: function() {
	    return ['font-awesome.css'];
	},

	// Override dom generator.
	getDom: function() {
		const wrapper = document.createElement("div");
		if (!this.loaded) {
			wrapper.innerHTML = `<div class="dimmed light small">Loading...</div>`;
			return wrapper;
		}

		const htmlRows = [];
		for (const i in this.sensors) {
			const sensor = this.sensors[i];

			let sensorSymbol = sensor.symbolStatic;
			if (sensor.boolean) {
				sensorSymbol = sensor.status === 1 ? sensor.symbolOn : sensor.symbolOff;
			}

			//puis on s'occupe du titre
			let sensorTitle = sensor.customTitle;
			if (sensor.boolean && sensor.customTitleOn && sensor.customTitleOff) {
				sensorTitle = sensor.status === 1 ? sensor.customTitleOn : sensor.customTitleOff;
			}

			let sensorStatus = sensor.status;
			if (sensor.boolean && sensor.statusOn && sensor.statusOff) {
				sensorStatus = sensor.status === 1 ? sensor.statusOn : sensor.statusOff;
			}
			if (sensor.unit) {
				sensorStatus += ` ${sensor.unit}`;
			}

			htmlRows.push(`
				<tr class="normal">
					<td class="symbol align-left"><i class="${sensorSymbol}"></i></td>
					<td class="title bright align-left">${sensorTitle}</td>
					<td class="time light align-right">${sensorStatus}</td>
				</tr>
			`);
		}

		let lastDate = '';
		if (this.config.displayLastUpdate) {
			lastDate = `
				<div class="xsmall light align-left" style="text-align: center; margin-top: 7px;">
					(${moment.unix(this.lastUpdate).format(this.config.displayLastUpdateFormat)})
				</div>
			`;
		}

		wrapper.innerHTML = `<table class="small">${htmlRows.join('')}</table>${lastDate}`;
		return wrapper;
	},

	updateJeedom: function() {
		this.lastUpdate = Date.now() / 1000 ;

		this.askJeedomStatuses(this.sensors.map(sensor => sensor.idx), (payload) => {
			for (const i in this.sensors) {
				const sensor = this.sensors[i];
				if (payload[sensor.idx] != null) {
					sensor.status = payload[sensor.idx];
				}
			}
			this.loaded = true;
			this.updateDom(this.animationSpeed);
		});
	},

	roundValue: function(temperature) {
		const decimals = this.config.roundTemp ? 0 : 1;
		const roundValue = parseFloat(temperature).toFixed(decimals);
		return roundValue === "-0" ? 0 : roundValue;
	},

	doGet: function(url, callback) {
		const req = new XMLHttpRequest();
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
});
