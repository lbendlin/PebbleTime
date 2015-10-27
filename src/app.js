var UI = require('ui');
var ajax = require('ajax');
//var Vector2 = require('vector2');
//var Accel = require('ui/accel');
//var Vibe = require('ui/vibe');

var menuItems = [];
var statData = [];
var baseURL = 'http://lbendlin.dyndns.info:8081/t/';
var selected = 0;
var statusLine = '';

// Create a splashscreen with title and subtitle
var splashCard = new UI.Card({
    title: 'Thermostats',
    subtitle: 'Fetching status...'
});

var detailCard = new UI.Card({
    action: {
        up: 'images/plus.png',
        select: 'images/confirm.png',
        down: 'images/minus.png'
    }
});
detailCard.on('show', function() {
    statusLine = statData.thermostats[selected].tstate ? 'On ' : '';
    statusLine += statData.thermostats[selected].override ? 'Over ' : '';
    statusLine += statData.thermostats[selected].hold ? 'Hold' : '';
    detailCard.title(statData.thermostats[selected].name);
    detailCard.subtitle(statData.thermostats[selected].temp);
    // target temp, heating on, override, hold
    detailCard.body('Target:' + statData.thermostats[selected].t_heat + '\n' + statusLine + '\nOutside:' + statData.outside);
});
detailCard.on('click', 'up', function() {
    // Up click detected!
    statData.thermostats[selected].t_heat++;
    detailCard.body('Target:' + statData.thermostats[selected].t_heat + '\n' + statusLine + '\nOutside:' + statData.outside);
});
detailCard.on('click', 'down', function() {
    // Down click detected!
    statData.thermostats[selected].t_heat--;
    detailCard.body('Target:' + statData.thermostats[selected].t_heat + '\n' + statusLine + '\nOutside:' + statData.outside);
});
detailCard.on('click', 'select', function() {
    // ajax call to set
    var req = 'postjson.aspx?URL=http://' + statData.thermostats[selected].ip;
    req += '/tstat&json={"tmode":1,"t_heat":' + statData.thermostats[selected].t_heat;
    req += ',"hold":' + statData.thermostats[selected].hold + '}' + '&r=' + Math.random();

    ajax({url: baseURL + req, type: 'text' },
        function(data) {
            //did it work?
            if (data.indexOf("success") != -1) {
              detailCard.body('Set to '+statData.thermostats[selected].t_heat);
              // ajax call to get new status
              req = 'getjson.aspx?URL=http://' + statData.thermostats[selected].ip + '/tstat&r=' + Math.random();
              ajax({url: baseURL + req, type: 'json' },
                   function(data) {
                     statData.thermostats[selected].t_heat=data.t_heat;
                     statData.thermostats[selected].tstate=data.tstate;
                     statData.thermostats[selected].hold=data.hold;
                     statData.thermostats[selected].override=data.override;
                     detailCard.hide();
                   },
                   function(error) {
                      detailCard.body(error);
                   }
               );    
            } else {
                detailCard.body(data);
            }
        },
        function(error) {
            detailCard.body(error);
        }
    );
});

var resultsMenu = new UI.Menu({
    sections: [{
        items: menuItems
    }]
});
resultsMenu.on('select', function(e) {
    selected = e.itemIndex;
    detailCard.show();
});

// Display the splash
splashCard.show();

//get list of thermostats and their current data from database
ajax({url: baseURL + 'tall.asp', type: 'json'},
    function(data) {
        statData = data;
        // load menu items
        for (var i = 0; i < statData.count; i++) {
            menuItems.push({
                title: statData.thermostats[i].name + '  ' + statData.thermostats[i].temp
            });
        }
        // Construct Menu to show to user

        // Show the Menu, hide the splash
        resultsMenu.show();
        splashCard.hide();

    },
    function(error) {
        // Failure!
        splashCard.subtitle('Cannot connect to thermostats');
    }
);

// Prepare the accelerometer
//Accel.init();
// Notify the user
//Vibe.vibrate('short');