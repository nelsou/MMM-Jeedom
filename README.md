# Magic Mirror 2 - JEEDOM Module v2

This module displays any JEEDOM command value. If you have a touchscreen, you will be able to trigger some command too.

The information will be updated depending on the polling time.

If a PIR-sensor using MMM-PIR-Sensor module is used, this information will not be updated during screen off. 

The infos will also not be updated when no instances of the MMM-Jeedom module are displayed on the screen (for example hidden by using MMM-Remote-Control or any carousel like MMM-Pages). This will allow to reduce the number of request to Jeedom API. 
As soon as one MMM-Jeedom module will be again displayed on the screen, all the instances will request an update of the datas. 

![alt text](https://github.com/nelsou/MMM-Jeedom/blob/master/screenshots/MMM-Jeedom_v2.png "Image of MMM-Jeedom v2")

![alt text](https://github.com/nelsou/MMM-Jeedom/blob/master/screenshots/MMM-Jeedom.png "Image of MMM-Jeedom")

![alt text](https://github.com/nelsou/MMM-Jeedom/blob/master/screenshots/MMM-Jeedom_1.png "Image of MMM-Jeedom_1")

![alt text](https://github.com/nelsou/MMM-Jeedom/blob/master/screenshots/MMM-Jeedom_2.png "Image of MMM-Jeedom_2")

## Module installation

Git clone this repo into ~/MagicMirror/modules directory :
```
cd ~/MagicMirror/modules
git clone https://github.com/prysme01/MMM-Jeedom.git
```
and add the configuration section in your Magic Mirror config file : 

## Module configuration
(1st example of the screenshot) :
````javascript
modules: [
{
  module: 'MMM-Jeedom',
  header: 'Jeedom Maison',
  position: "top_left",
  config: {
    updateInterval: 3000,
    jeedomAPIKey: "", 
    jeedomURL: "192.168.0.1 or hostname",
    jeedomPORT: 443,
    jeedomHTTPS: true,
    jeedomAPIPath: "/core/api/jeeApi.php",
    sensors: [
      {
        idx: 2463,
        title: "Consommation Maison",
        icon: "fa fa-bolt",
        status: {
          display: true,
          unit: "Watt",
        }
      },
      {
        idx: 2463,
        title: "Temperature Rez de Chaussee",
        icon: "fas fa-thermometer-full",
        status: {
          display: true,
          unit: "°C",
        }
      },
      {
        idx: 1859,
        iconOn: "fa fa-temperature-low",
        iconOff: "fa fa-temperature-high",
        titleOn: "Radiateur éteint",
        titleOff: "Radiateur allumé",
        value: {
          display: true,
          idx: 2463,
          unit: "°C",
        },
        action: {
          iconOn: 'fas fa-toggle-on',
          iconOff: 'fas fa-toggle-off',
          cmdIdOn: 1861,
          cmdIdOff: 1862,
        }
      },
      {
        idx: 1058,
        title: "Lumière",
        iconOn: "fas fa-lightbulb",
        iconOff: "far fa-lightbulb",

        action: {
          iconOn: 'fas fa-power-off',
          iconOff: 'fas fa-power-off',
          cmdIdOn: 1059,
          cmdIdOff: 1061,
        },
      }
    ],
    Virtual_API: "", // Code APi de vos virtuals
    TempID: "5089", // ID pour l'info température
    HumID: "5088", // ID pour l'info d'humidité
  }
},
]
````
* HTTPS and HTTP is supported
* you can define all the sensors you want
* you can add several time the module in your Magic Mirror config and define a different updateInterval
* symbol is based on [Fontawesome](http://fontawesome.io/icons/)
* if you define the sensor as a "boolean:true" then you can :
	- add symbolOn and symbolOff depending on the sensor value (0 or 1)
	- add customTitleOn and customTitleOff depending on the sensor value (0 or 1)

## Configuration Options

The following properties can be configured:

<table width="100%">
	<!-- why, markdown... -->
	<thead>
		<tr>
			<th>Option</th>
			<th width="100%">Description</th>
		</tr>
	<thead>
	<tbody>
		<tr>
			<td><code>updateInterval</code></td>
			<td>Update interval in ms<br>
				<br><b>Possible values:</b> <code>int</code>
				<br><b>Default value:</b> <code>5000</code>
				<br><b>Note:</b> This value is in ms
			</td>
		</tr>
		<tr>
			<td><code>jeedomAPIKey</code></td>
			<td>"Jeedom / paramétres / configuration / API . Activate the "Accès API JSONRPC" and take the API key globale of Jeedom<br>
			</td>
		</tr>
		<tr>
			<td><code>jeedomURL</code></td>
			<td>local or externe URL<br>
				<br><b>Possible values:</b> <code>192.168.1.18</code>
			</td>
		</tr>
		<tr>
			<td><code>jeedomPORT</code></td>
			<td>443 or 80<br>
				<br><b>Possible values:</b> <code>443 or 80</code>
				<br><b>Default value:</b> <code>443</code>
			</td>
		</tr>
		<tr>
			<td><code>jeedomHTTPS</code></td>
			<td>HTTPS or HTTP<br>
				<br><b>Possible values:</b> <code>boolean</code>
				<br><b>Default value:</b> <code>true</code>
			</td>
		</tr>
		<tr>
			<td><code>animationSpeed</code></td>
			<td>Speed to animate the display during an update, in ms<br>
				<br><b>Default value:</b> <code>1000</code>
			</td>
		</tr>
		<tr>
			<td><code>displayLastUpdate</code></td>
			<td>If true this will display the last update time at the end of the task list. See screenshot above<br>
				<br><b>Possible values:</b> <code>boolean</code>
				<br><b>Default value:</b> <code>false</code>
			</td>
		</tr>
		<tr>
			<td><code>displayLastUpdateFormat</code></td>
			<td>Format to use for the time display if displayLastUpdate:true <br>
				<br><b>Possible values:</b> See [Moment.js formats](http://momentjs.com/docs/#/parsing/string-format/)
				<br><b>Default value:</b> <code>'dd - HH:mm:ss'</code>
			</td>
		</tr>
		<tr>
			<td><code>sensors</code></td>
			<td>The list of sensor to be displayed, with extra config parameters : 		
				<ul style="list-style-type:disc">
					<li>idx: "1", : Jeedom ID of the equipement to display. Can be found in "Resumé domotique"</li>
					<li>symbol: "fa fa-tint", : symbol to display if no other condition</li>
					<li>symbolon: "fa fa-user", : symbol to display when equipement is ON if "boolean : true,"</li>
					<li>symboloff: "fa fa-user-o", : symbol to display when equipement is OFF if "boolean : true,"</li>
					<li>boolean : true, : if true, only the symbolon or symboloff is displayed</li>
					<li>hiddenon: false, : info to hide if value is On</li>
					<li>hiddenoff: false, : info to hide if value is Off</li>
					<li>hideempty: false, : info to hide if value is Empty</li>
					<li>customTitle: "No sensor define in config", : Title of this sensor</li>
					<li>customTitleOn: undefined, : Title to display when equipement is ON if "boolean : true,". If customTitleOn is not set, customTitle is displayed</li>
					<li>customTitleOff: undefined, : Title to display when equipement is OFF if "boolean : true,". If customTitleOff is not set, customTitle is displayed</li></li>
					<li>statuson: undefined, : Status to display when equipement is ON if "boolean : true,". If statuson is not set, status from Jeedom sensor is displayed</li>
					<li>statusoff: undefined, : Status to display when equipement is OFF if "boolean : true,". If statusoff is not set, status from Jeedom is displayed</li></li>
					<li>unit : "%", : unit to display after the value of the sensor</li>
					<li>sameLine1: false, : if true, it will be display on the same line than the "sameLine2: true". Only the value and the unit can be defined in that case. See example above</li>
					<li>sameLine2: false, : if true, it will be display on the same line than the "sameLine1: true". The title and symbol define here will be used for both infos. See example above</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td><code>Virtual_API</code></td>
			<td>This is the API key for update Virtual, you should find it on menu Params / System / API<br>					
			</td>
		</tr>
		<tr>
			<td><code>TempID</code></td>
			<td>This is the command ID for virtual temperature information send to jeedom<br>
				<br><b>Possible values:</b> <code>XXXX</code>				
			</td>
		</tr>
		<tr>
			<td><code>HumID</code></td>
			<td>This is the command ID for virtual Humidity information send to jeedom<br>
				<br><b>Possible values:</b> <code>XXXX</code>
			</td>
		</tr>
	</tbody>
</table>


## License

This project is licensed under the GPL License

## Acknowledgments

Thank you very much to [Mathias Arvidsson](https://github.com/M-Arvidsson/MMM-domoticz) for his code and inspiration for MMM-Domoticz
