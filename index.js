'use strict';

let request = require('request');

module.exports = robot => {
    const API_ROOT = 'https://api.automatic.com';
    const TOKEN = process.env.HUBOT_AUTOMATIC_TOKEN;

    if(!TOKEN) {
        return;
    }

    function listVehicles() {
        return new Promise((resolve, reject) => {
            request.get(`${API_ROOT}/vehicle`, {
                json: true,
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            }, (error, response, body) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(body.results);
                }
            });
        });
    }

    function getVehicle() {
        return listVehicles().then(vehicles => {
            return vehicles[0];
        });
    }

    let inProgress = false;
    robot.respond(/car fuel/, msg => {
        if(inProgress) {
            msg.send('Patience is a virtue!');
        } else {
            inProgress = true;
            getVehicle().then(vehicle => {
                msg.send(`Your fuel level is ${vehicle.fuel_level_percent}%`);
                inProgress = false;
            }).catch(error => {
                msg.send(`There was an error: ${error}`);
                inProgress = false;
            });
        }
    });
};
