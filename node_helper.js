const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	start: function() {

	},

	socketNotificationReceived: function(notification, payload) {
	    if (notification === 'RELOAD') {
			for (var c in payload.sensors) {
					var sensor = payload.sensors[c];
			}
	      	this.reload(payload);
	    }
	}
});






