import express from 'express';
import route from './hapiModule/hapi.route.js'
import { getChart, getReport, getServer, getChartFromReports } from './modules/query.js'
import { getHostReport, getHostServer, getHostChartFromReports } from './modules/hostsQuery.js'
import connectToDatabase from "./db/index.js";
import cookieParser from 'cookie-parser';
import validateRequest from './auth.middleware.js'
import bodyParser from "body-parser";
import logger from "./logger.js";

import fs from 'fs';
import http from 'http'
import https from 'https'

import ed from "ed25519-supercop";
import base64url from "base64url";
import passport from "passport";
import { Strategy } from "passport-http-bearer";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.all('*', ensureSecure); // at top of routing call
app.use(cookieParser('something strange here')); // should make function here and below for Session

/**/
app.use(passport.initialize());

passport.use(
  new Strategy({ passReqToCallback: true }, function (req, token, func) {
    try {
      let items = token.split(".");
      let sign = ed.verify(
        base64url.toBuffer(items[2]),
        Buffer.from(items[0] + items[1]),
        keypair.publicKey
      );console.log(sign)
      if (sign == false) {
        return func(null, false, { message: "User is not authorized" });
      }

      let payload = JSON.parse(base64url.decode(items[1]));
      console.log(payload, payload.exp - Date.now() <= 0)
      if (payload.exp - Date.now() <= 0) return func(null, false);
      return func(null, payload);
    } catch (e) {
      return func(null, false,e);
    }
  })
);
export var keypair = {};
/** */


app.use('/', route)
app.get('/api/charts', passport.authenticate("bearer", { session: false }), async (req, res) => { return getChart(req, res); });
app.get('/api/server_chart', passport.authenticate("bearer", { session: false }), async (req, res) => { return getChartFromReports(req, res); });
app.get('/api/reports', passport.authenticate("bearer", { session: false }), async (req, res) => { return getReport(req, res); });
app.get('/api/servers', passport.authenticate("bearer", { session: false }), async (req, res) => { return getServer(req, res); });
app.get('/api/host_reports', passport.authenticate("bearer", { session: false }), async (req, res) => { return getHostReport(req, res); });
app.get('/api/host_servers', passport.authenticate("bearer", { session: false }), async (req, res) => { return getHostServer(req, res); });
const options = { key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') };
var httpServer = http.createServer(app);
// var httpServer2 = http.createServer(app);
var httpsServer = https.createServer(options, app);

httpServer.listen(process.env.BACKEND_PORT, process.env.BACKEND_IP, async function () {
    try {
        connectToDatabase()
        keypair = ed.createKeyPair(ed.createSeed());
        //console.log(keypair)
    } catch (e) {
        logger.info(e.message)
    }
})
httpsServer.listen(process.env.BACKEND_SSL_PORT, process.env.BACKEND_IP, async function () {
    console.log('Statistic WEB portal https listening ip/port: ', process.env.BACKEND_IP, process.env.BACKEND_SSL_PORT);
})
process.on('uncaughtException', function (err) {
    logger.info(err.stack);
    //console.log("Node NOT Exiting...");
  });
function ensureSecure(req, res, next) {
    if (req.secure) next();
    else {
        if (req.url === "/" + process.env.FILE_AUTH + "?" || req.url === "/" + process.env.FILE_PASS + "?")
            next();
        else {
            res.setHeader("Location", "https://" + req.hostname + ":" + process.env.FRONTEND_SSL_PORT + req.url);
            res.status(308);
            res.send();
        }
    }
