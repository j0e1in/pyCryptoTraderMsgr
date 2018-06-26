'use strict'

require('dotenv').config()
const moment = require('moment-timezone')
const express = require('express')
const bodyParser = require('body-parser')
const https = require('https')
const fs = require('fs')
const crypto = require('crypto')
const ArgumentParser = require('argparse').ArgumentParser
const { absolutePath } = require('./src/utils')
const logger = require('./src/logger')

const parseArgs = () => {
  const parser = new ArgumentParser()

  parser.addArgument(['--port', '-p'], {
    'defaultValue': 443,
    'help': 'Server port'
  })

  parser.addArgument(['--root'], {
    'defaultValue': __dirname,
    'help': 'Project root directory absolute path'
  })

  return parser.parseArgs(process.argv.slice(2))
}

const argv = parseArgs()

// Change some file path to absolute path
process.env.ACCOUNT_CREDENTIAL = absolutePath(process.env.ACCOUNT_CREDENTIAL, argv.root)
process.env.HTTPS_PRIVATE_KEY = absolutePath(process.env.HTTPS_PRIVATE_KEY, argv.root)
process.env.HTTPS_CERTIFICATE = absolutePath(process.env.HTTPS_CERTIFICATE, argv.root)

const app = express()
const PagesManager = require('./src/account/PagesManager')
const pagesData = JSON.parse(fs.readFileSync(process.env.ACCOUNT_CREDENTIAL, 'utf8')).pages

const verifyRequestSignature = (providedHash, buf) => {
  for (let page_id in pagesData) {
    let expectedHash = crypto
      .createHmac('sha1', pagesData[page_id].fb_secrets.FB_APP_SECRET)
      .update(buf)
      .digest('hex')
    if (providedHash === expectedHash) return true
  }
  return false
}

const _verifyRequestSignature = (req, res, buf) => {
  var signature = req.headers['x-hub-signature']

  if (!signature) {
    throw new Error("Couldn't validate the request signature.")
  } else {
    var elements = signature.split('=')
    var method = elements[0]
    var signatureHash = elements[1]

    if (!verifyRequestSignature(signatureHash, buf)) {
      throw new Error("Couldn't validate the request signature.")
    }
  }
}

app.use(bodyParser.json({ verify: _verifyRequestSignature }))
app.set('port', argv.port || 3000)

const Bots = new PagesManager(process.env.ACCOUNT_CREDENTIAL, app)

moment.tz.setDefault('Asia/Taipei')

app.post('/webhook', (req, res, buf) => {
  const data = req.body
  const entry_id = data.entry[0].id
  Bots.handlePostData(entry_id, data)

  // Must send back a 200 within 20 seconds or the request will time out.
  res.sendStatus(200)
})

app.get('/webhook', (req, res) => {
  if (
    req.query['hub.mode'] === 'subscribe' &&
    Bots.webhookValidation(req.query['hub.verify_token'])
  ) {
    logger.info('Validation Succeded.')
    res.status(200).send(req.query['hub.challenge'])
  } else {
    console.error('Failed validation. Make sure the validation tokens match.')
    res.sendStatus(403)
  }
})

https
  .createServer(
    {
      key: fs.readFileSync(process.env.HTTPS_PRIVATE_KEY),
      cert: fs.readFileSync(process.env.HTTPS_CERTIFICATE)
    },
    app
  )
  .listen(app.get('port'), () => {
    logger.info(`Messenger bot running on port ${app.get('port')}`)
  })

Bots.broadcast('[SERVER][INFO] Messenger server starting up!', process.env.ENVIRONMENT)