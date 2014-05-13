"use strict";

var fluid = require("infusion"),
    loader = fluid.getLoader(__dirname),
    flock = fluid.registerNamespace("flock");

loader.require("./lib/app.js");

var colin = fluid.registerNamespace("colin");

flock.init();

var motors = colin.motors.app();
motors.kick.play();
