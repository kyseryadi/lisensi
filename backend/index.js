const express = require('express');
const createApp = require('./src/app');

// Vercel entry point; local development uses src/server.js.
module.exports = createApp();
