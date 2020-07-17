'use strict'
const monk = require('monk');

const db = monk('localhost/EventDB');
module.exports = db;
