'use strict'

const axios = require('axios')
const math = require('mathjs')
const moment = require('moment')
const logger = require('./logger')
const {
  botSendTemplateWithOrder,
  checkRequestMiddleware,
} = require('./utils')

const trader_url = process.env.TRADER_URL
const trader_port = process.env.TRADER_PORT

math.config({
  notation: 'fixed'
})

module.exports.module = (pageManager, app, bots, userlists, broadcast) => {
  let cannotPing = false

  const checkUserMiddleware = (req, res, next) => {
    let userinfo
    let username = req.params.username
    for (let username in userlists)
      if (req.params.username === username) userinfo = userlists[username]

    if (userinfo) {
      req.fb_user_id = userinfo.user_id
      req.page_id = userinfo.page_id
      return next()
    }

    logger.warn(`Error notification endpoint: URL=(${req.originalUrl}),
                 IP=(${req.ip}), UID=(${req.params.username})`)

    return res.status(404).json({
      ok: false,
      msg: `Error user id provided: ${req.params.userid}`
    })
  }

  const ping = () => {
    axios
      .get(
        `${trader_url}:${trader_port}/ping`,
        {},
        {
          timeout: 10000
        }
      )
      .then(response => {
        // Broadcast if previous ping has failed
        if (cannotPing) {
          cannotPing = false
          broadcast.call(pageManager, `[SERVER][INFO] Trader back online!`)
        }
        logger.debug('Ping trader server succeeded')
      })
      .catch(error => {
        logger.error(`Cannot ping ${trader_url}:${trader_port}`)

        // only notify user once after failing to ping
        if (!cannotPing) broadcast.call(pageManager, `[SERVER][ERROR] Cannot ping trader!`)
        cannotPing = true
      })
  }

  ping()
  setInterval(ping, 1000 * 60 * 5)

  app.post(
    '/notification/order/open/:username',
    [checkRequestMiddleware, checkUserMiddleware],
    (req, res) => {
      let promise
      let count = 0
      let msg = '[ ORDER - OPEN ]\n\n'
      if (req.body.orders) {
        req.body.orders.forEach(e => {
          msg += `${e.exchange} - ${e.symbol} - ${e.type}
${e.margin ? 'margin ' : ''} ${e.side}
Amount: ${math.format(e.amount, { precision: 4, lowerExp: -6 })}
Price: ${math.format(e.price, { precision: 4, lowerExp: -6 })}\n
`

          if (++count >= 4) {
            promise = botSendTemplateWithOrder(
              'msg',
              promise,
              msg,
              bots[req.page_id].getBot(),
              req.fb_user_id
            )
            msg = ''
            count = 0
          }
        })

        if (count > 0) {
          promise = botSendTemplateWithOrder(
            'msg',
            promise,
            msg,
            bots[req.page_id].getBot(),
            req.fb_user_id
          )
        }

        promise
          .then(() => {
            res.json({
              ok: true
            })
          })
          .catch(error => {
            res.status(500).json({
              ok: false,
              msg: error
            })
          })
      } else {
        res.status(404).json({
          ok: false,
          msg: 'Error request provided'
        })
      }
    }
  )

  app.post(
    '/notification/order/fail/:username',
    [checkRequestMiddleware, checkUserMiddleware],
    (req, res) => {
      let promise
      let count = 0
      let msg = '[ ORDER - FAIL ]\n\n'
      if (req.body.orders) {
        req.body.orders.forEach(e => {
          msg += `${e.exchange} - ${e.symbol} - ${e.type}
${e.margin ? 'margin ' : ''} ${e.side}
Amount: ${math.format(e.amount, { precision: 4, lowerExp: -6 })}
Price: ${math.format(e.price, { precision: 4, lowerExp: -6 })}\n
`
          if (++count >= 4) {
            promise = botSendTemplateWithOrder(
              'msg',
              promise,
              msg,
              bots[req.page_id].getBot(),
              req.fb_user_id
            )
            msg = ''
            count = 0
          }
        })

        if (count > 0) {
          promise = botSendTemplateWithOrder(
            'msg',
            promise,
            msg,
            bots[req.page_id].getBot(),
            req.fb_user_id
          )
        }

        promise
          .then(() => {
            res.json({
              ok: true
            })
          })
          .catch(error => {
            res.status(500).json({
              ok: false,
              msg: error
            })
          })
      } else {
        res.status(404).json({
          ok: false,
          msg: 'Error request provided'
        })
      }
    }
  )

  // app.post("/notification/order/cancel/:username", [checkRequestMiddleware, checkUserMiddleware], (req, res) =>  {
  //   bots[req.page_id].say(req.fb_user_id, "Order open")
  //   res.json({
  //     "ok": true
  //   })
  // })

  // app.post("/notification/position/close/:username", [checkRequestMiddleware, checkUserMiddleware], (req, res) =>  {
  //   bots[req.page_id].say(req.fb_user_id, "Order open")
  //   res.json({
  //     "ok": true
  //   })
  // })

  app.post(
    '/notification/position/danger/:username',
    [checkRequestMiddleware, checkUserMiddleware],
    (req, res) => {
      let elements = []
      let promise
      if (req.body.positions) {
        req.body.positions.forEach(e => {
          elements.push({
            title: `Position in DANGER - ${e.exchange} - ${e.symbol} - ${e.side}`,
            subtitle: `Amount: ${math.format(e.amount, {
              precision: 4,
              lowerExp: -6
            })} Price:${math.format(e.price, { precision: 4, lowerExp: -6 })} Value: ${math.format(
              e.value,
              { precision: 4, lowerExp: -6 }
            )} PL:${math.format(e.PL, { precision: 4, lowerExp: -6 })}`
          })

          if (elements.length === 4) {
            promise = botSendTemplateWithOrder(
              'list',
              promise,
              elements,
              bots[req.page_id].getBot(),
              req.fb_user_id
            )
            elements = []
          }
        })

        if (elements.length)
          if (elements.length !== 1)
            promise = botSendTemplateWithOrder(
              'list',
              promise,
              elements,
              bots[req.page_id].getBot(),
              req.fb_user_id
            )
          else
            promise = botSendTemplateWithOrder(
              'generic',
              promise,
              elements,
              bots[req.page_id].getBot(),
              req.fb_user_id
            )

        promise
          .then(() => {
            res.json({
              ok: true
            })
          })
          .catch(() => {
            res.status(500).json({
              ok: false
            })
          })
      } else {
        res.status(404).json({
          ok: false,
          msg: 'Error request provided'
        })
      }
    }
  )

  app.post(
    '/notification/position/large_pl/:username',
    [checkRequestMiddleware, checkUserMiddleware],
    (req, res) => {
      let elements = []
      let promise
      if (req.body.positions) {
        req.body.positions.forEach(e => {
          elements.push({
            title: `Large PL - ${e.exchange} - ${e.symbol} - ${e.type} - ${e.side} ${
              e.margin ? '- Margin' : ''
            }`,
            subtitle: `Amount: ${math.format(e.amount, {
              precision: 4,
              lowerExp: -6
            })} Price:${math.format(e.price, { precision: 4, lowerExp: -6 })} PL:${math.format(
              e.PL,
              { precision: 4, lowerExp: -6 }
            )} PL(%):${math.format(e['PL(%)'], { precision: 4, lowerExp: -6 })}`
          })

          if (elements.length === 4) {
            promise = botSendTemplateWithOrder(
              'list',
              promise,
              elements,
              bots[req.page_id].getBot(),
              req.fb_user_id
            )
            elements = []
          }
        })

        if (elements.length)
          if (elements.length !== 1)
            promise = botSendTemplateWithOrder(
              'list',
              promise,
              elements,
              bots[req.page_id].getBot(),
              req.fb_user_id
            )
          else
            promise = botSendTemplateWithOrder(
              'generic',
              promise,
              elements,
              bots[req.page_id].getBot(),
              req.fb_user_id
            )

        promise
          .then(() => {
            res.json({
              ok: true
            })
          })
          .catch(() => {
            res.status(500).json({
              ok: false
            })
          })
      } else {
        res.status(404).json({
          ok: false,
          msg: 'Error request provided'
        })
      }
    }
  )

  app.post(
    '/notification/log/:username',
    [checkRequestMiddleware, checkUserMiddleware],
    (req, res) => {
      if (req.body.level && req.body.message) {
        let promise = bots[req.page_id].getBot().sendTemplate(req.fb_user_id, {
          template_type: 'generic',
          elements: [
            {
              title: `[LOG][${req.body.level}]`,
              subtitle: `${req.body.message}`
            }
          ]
        })
        promise
          .then(() => {
            res.json({
              ok: true
            })
          })
          .catch(() => {
            res.status(500).json({
              ok: false
            })
          })
      } else {
        res.status(404).json({
          ok: false,
          msg: 'Error request provided'
        })
      }
    }
  )

  app.post(
    '/notification/start/:username',
    [checkRequestMiddleware, checkUserMiddleware],
    (req, res) => {
      if (req.body.message) {
        let promise = bots[req.page_id].getBot().sendTemplate(req.fb_user_id, {
          template_type: 'generic',
          elements: [
            {
              title: `Trader start`,
              subtitle: `${req.body.message}`
            }
          ]
        })
        promise
          .then(() => {
            res.json({
              ok: true
            })
          })
          .catch(() => {
            res.status(500).json({
              ok: false
            })
          })
      } else {
        res.status(404).json({
          ok: false,
          msg: 'Error request provided'
        })
      }
    }
  )

  app.post(
    '/notification/message/:username',
    [checkRequestMiddleware, checkUserMiddleware],
    (req, res) => {
      if (req.body.message) {
        let promise = bots[req.page_id].getBot().sendTemplate(req.fb_user_id, {
          template_type: 'generic',
          elements: [
            {
              title: `Trader message`,
              subtitle: `${req.body.message}`
            }
          ]
        })
        promise
          .then(() => {
            res.json({
              ok: true
            })
          })
          .catch(() => {
            res.status(500).json({
              ok: false
            })
          })
      } else {
        res.status(404).json({
          ok: false,
          msg: 'Error request provided'
        })
      }
    }
  )
}
