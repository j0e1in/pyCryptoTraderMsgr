'use strict'

require('dotenv').config()
const moment = require('moment-timezone')
const BootBot = require('bootbot')
const { logger } = require('./utils/logger')
const express = require('express')
const bodyParser = require('body-parser')
const https = require('https')
const fs = require('fs')
const crypto = require('crypto')

const app = express()
const PagesManager = require('./src/account/PagesManager')
const pagesData = JSON.parse(fs.readFileSync('private/account.json', 'utf8')).pages

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
app.set('port', process.env.SERVER_PORT || 3000)

const Bots = new PagesManager('private/account.json', app)

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
    console.log('Validation Succeded.')
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
    console.log(`Boot bot running on port ${app.get('port')}`)
  })

Bots.broadcast('[SERVER][INFO] Server starting up!', process.env.ENVIRONMENT)

logger.log({
  level: 'info',
  message: 'Starting the traddercomm server...'
})
