'use strict'

const axios = require('axios')
const math = require('mathjs')
const moment = require('moment')
const { chatSay, chatSendTemplateWithOrder, setTraderDefaultExchange } = require('../utils/utils')

const trader_url = process.env.TRADER_URL
const trader_port = process.env.TRADER_PORT
const trader_timeout = process.env.TRADER_REQUEST_TIMEOUT

module.exports.persistentMenuElements = {
  title: 'Account',
  type: 'nested',
  call_to_actions: [
    {
      title: 'Account summary',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Balance',
          type: 'postback',
          payload: 'BALANCE_PAYLOAD'
        },
        {
          title: 'Summary',
          type: 'postback',
          payload: 'SUMMARY_PAYLOAD'
        }
      ]
    },
    {
      title: 'Markets',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Active Markets',
          type: 'postback',
          payload: 'ACTIVE_MARKETS_PAYLOAD'
        },
        {
          title: 'Inactive Markets',
          type: 'postback',
          payload: 'INACTIVE_MARKETS_PAYLOAD'
        }
      ]
    },
    {
      title: 'Trader info',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Trading Signals',
          type: 'postback',
          payload: 'TRADING_SIGNALS_PAYLOAD'
        },
        {
          title: 'All Trading Signals',
          type: 'postback',
          payload: 'ALL_TRADING_SIGNALS_PAYLOAD'
        }
      ]
    },
    {
      title: 'Orders and Positions',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Active Orders',
          type: 'postback',
          payload: 'ACTIVE_ORDERS_PAYLOAD'
        },
        {
          title: 'Active Positions',
          type: 'postback',
          payload: 'ACTIVE_POSITIONS_PAYLOAD'
        }
      ]
    },
    {
      title: 'User Action',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Get Exchange',
          type: 'postback',
          payload: 'GET_DEFAULT_EXCHANGE_PAYLOAD'
        },
        {
          title: 'Set Exchange',
          type: 'postback',
          payload: 'CHOOSE_DEFAULT_EXCHANGE_PAYLOAD'
        }
      ]
    }
  ]
}

module.exports.module = (bot, userlists) => {
  const checkUserBeforeContinue = (fb_user_id, cb) => {
    let userinfo
    for (let username in userlists)
      if (userlists[username].uid === fb_user_id.toString()) userinfo = userlists[username]

    if (userinfo) {
      cb(userinfo)
    } else {
      logger.log({
        level: 'warn',
        message: `Non trader user: User=(${fb_user_id})`
      })
    }
  }

  // TODO:
  bot.on('postback:SUMMARY_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      axios
        .get(
          `${trader_url}:${trader_port}/account/summary/${userinfo.uid}/${
            userinfo.default_exchange
          }`,
          {
            // "headers": {
            //     "dummy-data": true
            // }
          },
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let elements = []

          chat.conversation(convo => {
            convo.set('data', response.data)
            promise = chatSendTemplateWithOrder(
              'list',
              promise,
              [
                {
                  title: `Initial value & Current value`,
                  subtitle: `Initial value: ${math.format(response.data.initial_value, {
                    precision: 4,
                    lowerExp: -6
                  })}\tCurrent value:${math.format(response.data.current_value, {
                    precision: 4,
                    lowerExp: -6
                  })}`
                },
                {
                  title: `PL & PL(%)`,
                  subtitle: `PL: ${math.format(response.data.PL, {
                    precision: 4,
                    lowerExp: -6
                  })} PL(%): ${math.format(response.data['PL(%)'], {
                    precision: 4,
                    lowerExp: -6
                  })} PL_Eff: ${math.format(response.data.PL_Eff, { precision: 4, lowerExp: -6 })}`
                },
                {
                  title: `Profit trades & Loss trades`,
                  subtitle: `Profit trades: ${math.format(response.data['#profit_trades'], {
                    precision: 4,
                    lowerExp: -6
                  })}\tLoss trades:${math.format(response.data['#loss_trades'], {
                    precision: 4,
                    lowerExp: -6
                  })}`
                },
                {
                  title: `Trade fee & Margin fee`,
                  subtitle: `Trade fee: ${math.format(response.data.total_trade_fee, {
                    precision: 4,
                    lowerExp: -6
                  })}\tMargin fee:${math.format(response.data.total_margin_fee, {
                    precision: 4,
                    lowerExp: -6
                  })}`
                }
              ],
              convo
            )

            promise.then(() => {
              convo.ask(
                {
                  text: 'Do you need to view detail?',
                  quickReplies: ['Show detail', 'No need']
                },
                (payload, convo) => {
                  const text = payload.message.text
                  switch (text) {
                    case 'Show detail':
                      let hasElement = false

                      for (var currency in response.data.initial_balance) {
                        if (
                          response.data.initial_balance[currency].exchange ||
                          response.data.initial_balance[currency].funding ||
                          response.data.initial_balance[currency].margin
                        ) {
                          hasElement = true
                          elements.push({
                            title: `Initial Balance - ${currency}: ${math.format(
                              response.data.initial_balance[currency].exchange +
                                response.data.initial_balance[currency].margin +
                                response.data.initial_balance[currency].funding,
                              { precision: 4, lowerExp: -6 }
                            )}`,
                            subtitle: `Funding: ${math.format(
                              response.data.initial_balance[currency].funding,
                              { precision: 4, lowerExp: -6 }
                            )}  Margin: ${math.format(
                              response.data.initial_balance[currency].margin,
                              { precision: 4, lowerExp: -6 }
                            )} Exchange: ${math.format(
                              response.data.initial_balance[currency].exchange,
                              { precision: 4, lowerExp: -6 }
                            )}`
                          })

                          // Because fb's list template MAX element count is 4,
                          // we need to sent it immediately
                          if (elements.length === 4) {
                            promise = chatSendTemplateWithOrder('list', promise, elements, convo)
                            elements = []
                          }
                        }
                      }

                      for (var currency in response.data.current_balance) {
                        if (
                          response.data.current_balance[currency].exchange ||
                          response.data.current_balance[currency].funding ||
                          response.data.current_balance[currency].margin
                        ) {
                          hasElement = true
                          elements.push({
                            title: `Current Balance - ${currency}: ${math.format(
                              response.data.current_balance[currency].exchange +
                                response.data.current_balance[currency].margin +
                                response.data.current_balance[currency].funding,
                              { precision: 4, lowerExp: -6 }
                            )}`,
                            subtitle: `Funding: ${math.format(
                              response.data.current_balance[currency].funding,
                              { precision: 4, lowerExp: -6 }
                            )} \t Margin: ${math.format(
                              response.data.current_balance[currency].margin,
                              { precision: 4, lowerExp: -6 }
                            )} \t Exchange: ${math.format(
                              response.data.current_balance[currency].exchange,
                              { precision: 4, lowerExp: -6 }
                            )}`
                          })

                          // Because fb's list template MAX element count is 4,
                          // we need to sent it immediately
                          if (elements.length === 4) {
                            promise = chatSendTemplateWithOrder('list', promise, elements, convo)
                            elements = []
                          }
                        }
                      }

                      if (elements.length)
                        if (elements.length === 1)
                          // Because fb's list template MIN element count is 2,
                          // we need to send a generic template rather than the list one
                          chatSendTemplateWithOrder('generic', promise, elements, convo)
                        else chatSendTemplateWithOrder('list', promise, elements, convo)

                      if (!hasElement) convo.say('No Initial/Current balance')

                      convo.end()
                      break
                    case 'No need':
                    default:
                      convo.end()
                  }
                }
              )
            })
          })
        })
        .catch(function(error) {
          chat.say(`Error occurred! Msg: ${error}`)
        })
    })
  })

  bot.on('postback:ACTIVE_ORDERS_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      axios
        .get(
          `${trader_url}:${trader_port}/account/active/orders/${userinfo.uid}/${
            userinfo.default_exchange
          }`,
          {
            headers: {
              // "dummy-data": true
            }
          },
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let msg = '[ ACTIVE ORDER ]\n\n'
          let count = 0
          let hasElement = false
          response.data.orders
            .sort((a, b) => {
              return a.price > b.price ? 1 : a.price === b.price ? 0 : -1
            })
            .sort((a, b) => {
              return a.side > b.side ? 1 : a.side === b.side ? 0 : -1
            })
            .sort((a, b) => {
              return a.symbol > b.symbol ? 1 : a.symbol === b.symbol ? 0 : -1
            })

          response.data.orders.forEach(e => {
            hasElement = true

            msg += `----------------------------------
${e.symbol} - ${e.type} - ${e.side} ${e.margin ? '- margin' : ''}

${'Amount:'.padEnd(15)}${math.format(e.amount, { precision: 4, lowerExp: -6 })}
${'Price:'.padEnd(15)}${math.format(e.price, { precision: 4, lowerExp: -6 })}
${'Value:'.padEnd(15)}${math.format(e.amount * e.price, { precision: 4, lowerExp: -6 })}

${moment(e.timestamp).format('M/D h:mm:ss a')}
----------------------------------\n
`

            // Because fb's list template MAX element count is 4,
            // we need to sent it immediately
            if (++count >= 4) {
              promise = chatSendTemplateWithOrder('msg', promise, msg, chat)
              count = 0
              msg = ''
            }
          })

          if (count > 0) chatSendTemplateWithOrder('msg', promise, msg, chat)

          if (!hasElement) chat.say(`No active order!`)
        })
        .catch(function(error) {
          chat.say(`Error occurred! Msg: ${error}`)
        })
    })
  })

  bot.on('postback:ALL_TRADING_SIGNALS_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      axios
        .get(
          `${trader_url}:${trader_port}/trading/signals_all/${userinfo.uid}/${
            userinfo.default_exchange
          }`,
          {
            // "headers": {
            //     "dummy-data": true
            // }
          },
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let type = 'list'
          let elements = []
          let hasElement = false

          Object.keys(response.data.signals)
            .sort()
            .forEach(currency => {
              let text = ''
              response.data.signals[currency].forEach(e => {
                hasElement = true
                text += `${moment(e.timestamp).format(' YYYY/MM/D HH:mm:ss')}  ${e.signal}\n`
              })

              promise = chatSay(`[ ${currency} ]\n\n${text}`, promise, chat)
            })

          if (!hasElement) chat.say('No signals!')
        })
        .catch(function(error) {
          chat.say(`Error occurred! Msg: ${error}`)
        })
    })
  })

  bot.on('postback:TRADING_SIGNALS_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      axios
        .get(
          `${trader_url}:${trader_port}/trading/signals/${userinfo.uid}/${
            userinfo.default_exchange
          }`,
          {
            // "headers": {
            //     "dummy-data": true
            // }
          },
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let type = 'list'
          let elements = []
          let hasElement = false

          Object.keys(response.data.signals)
            .sort()
            .forEach(currency => {
              let text = ''
              response.data.signals[currency].forEach(e => {
                hasElement = true
                text += `${moment(e.timestamp).format(' YYYY/MM/D HH:mm:ss')}  ${e.signal}\n`
              })

              promise = chatSay(`[ ${currency} ]\n\n${text}`, promise, chat)
            })

          if (!hasElement) chat.say('No signals!')
        })
        .catch(function(error) {
          chat.say(`Error occurred! Msg: ${error}`)
        })
    })
  })

  //  TODO: move to shared files

  // TODO:
  bot.on('postback:ACTIVE_POSITIONS_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      axios
        .get(
          `${trader_url}:${trader_port}/account/active/positions/${userinfo.uid}/${
            userinfo.default_exchange
          }`,
          {
            headers: {
              // "dummy-data": true
            }
          },
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let type = 'list'
          let msg = '[ ACTIVE POSITION ]\n\n'
          let count = 0
          let hasElement = false
          response.data.positions
            .sort((a, b) => {
              return a.price > b.price ? 1 : a.price === b.price ? 0 : -1
            })
            .sort((a, b) => {
              return a.side > b.side ? 1 : a.side === b.side ? 0 : -1
            })
            .sort((a, b) => {
              return a.symbol > b.symbol ? 1 : a.symbol === b.symbol ? 0 : -1
            })

          response.data.positions.forEach(e => {
            hasElement = true

            msg += `------------------------
${e.symbol} - ${e.side}

${'Amount:'.padEnd(15)}${math.format(e.amount, { precision: 4, lowerExp: -6 })}
${'Price:'.padEnd(15)}${math.format(e.price, { precision: 4, lowerExp: -6 })}
${'Value:'.padEnd(15)}${math.format(e.value, { precision: 4, lowerExp: -6 })}
${'PL:'.padEnd(15)}${math.format(e['PL'], { precision: 4, lowerExp: -6 })}
${'PL(%):'.padEnd(15)}${math.format(e['PL(%)'], { precision: 4, lowerExp: -6 })}

${moment(e.timestamp).format('M/D h:mm:ss a')}
------------------------\n
`

            // Because fb's list template MAX element count is 4,
            // we need to sent it immediately
            if (++count >= 4) {
              promise = chatSendTemplateWithOrder('msg', promise, msg, chat)
              count = 0
              msg = ''
            }
          })

          if (count > 0) promise = chatSendTemplateWithOrder('msg', promise, msg, chat)

          if (!hasElement) chat.say('No active position!')
        })
        .catch(function(error) {
          chat.say(`Error occurred! Msg: ${error}`)
        })
    })
  })

  bot.on('postback:BALANCE_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      axios
        .get(
          `${trader_url}:${trader_port}/account/info/${userinfo.uid}/${userinfo.default_exchange}`,
          {
            // 'dummy-data' : true
          },
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let elements = []
          let hasElement = false
          for (var currency in response.data.balance) {
            if (
              response.data.balance[currency].exchange ||
              response.data.balance[currency].funding ||
              response.data.balance[currency].margin
            ) {
              hasElement = true
              elements.push({
                title: `${currency}: ${math.format(
                  response.data.balance[currency].exchange +
                    response.data.balance[currency].margin +
                    response.data.balance[currency].funding,
                  { precision: 4, lowerExp: -6 }
                )}`,
                subtitle: `Funding: ${math.format(response.data.balance[currency].funding, {
                  precision: 4,
                  lowerExp: -6
                })} \t Margin: ${math.format(response.data.balance[currency].margin, {
                  precision: 4,
                  lowerExp: -6
                })} \t Exchange: ${math.format(response.data.balance[currency].exchange, {
                  precision: 4,
                  lowerExp: -6
                })}`
              })
            }

            // Because fb's list template MAX element count is 4,
            // we need to sent it immediately
            if (elements.length === 4) {
              promise = chatSendTemplateWithOrder('list', promise, elements, chat)
              elements = []
            }
          }

          if (elements.length)
            if (elements.length === 1)
              // Because fb's list template MIN element count is 2,
              // we need to send a generic template rather than the list one
              chatSendTemplateWithOrder('generic', promise, elements, chat)
            else chatSendTemplateWithOrder('list', promise, elements, chat)

          if (!hasElement) chat.say('No balance')
        })
        .catch(function(error) {
          console.log(error)
          chat.say(`Error occurred! Msg: ${error}`)
        })
    })
  })

  bot.on('postback:ACTIVE_MARKETS_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      axios
        .get(
          `${trader_url}:${trader_port}/account/info/${userinfo.uid}/${userinfo.default_exchange}`,
          {},
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let elements = []
          let hasElement = false

          response.data.active_markets.sort((a, b) => {
            let aa = a.symbol.split('/')[1]
            let bb = b.symbol.split('/')[1]
            return aa > bb ? 1 : aa === bb ? 0 : -1
          })

          response.data.active_markets.sort((a, b) => {
            let aa = a.symbol.split('/')[0]
            let bb = b.symbol.split('/')[0]
            return aa > bb ? 1 : aa === bb ? 0 : -1
          })

          response.data.active_markets.forEach(e => {
            hasElement = true
            elements.push({
              title: `${e.symbol}` + (e.margin ? ` - margin` : ``),
              subtitle: `${moment(e.start_timestamp).format('HH:mm:ss M/D')}`
            })
            // Because fb's list template MAX element count is 4,
            // we need to sent it immediately
            if (elements.length === 4) {
              promise = chatSendTemplateWithOrder('list', promise, elements, chat)
              elements = []
            }
          })

          if (elements.length)
            if (elements.length === 1)
              // Because fb's list template MIN element count is 2,
              // we need to send a generic template rather than the list one
              chatSendTemplateWithOrder('generic', promise, elements, chat)
            else chatSendTemplateWithOrder('list', promise, elements, chat)

          if (!hasElement) chat.say('No active markets!')
        })
        .catch(function(error) {
          chat.say(`Error occurred! Msg: ${error}`)
        })
    })
  })

  bot.on('postback:INACTIVE_MARKETS_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      axios
        .get(
          `${trader_url}:${trader_port}/account/info/${userinfo.uid}/${userinfo.default_exchange}`,
          {},
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let elements = []
          let hasElement = false

          response.data.inactive_markets.sort((a, b) => {
            let aa = a.symbol.split('/')[1]
            let bb = b.symbol.split('/')[1]
            return aa > bb ? 1 : aa === bb ? 0 : -1
          })

          response.data.inactive_markets.sort((a, b) => {
            let aa = a.symbol.split('/')[0]
            let bb = b.symbol.split('/')[0]
            return aa > bb ? 1 : aa === bb ? 0 : -1
          })

          response.data.inactive_markets.forEach(e => {
            hasElement = true
            elements.push({
              title: `${e.symbol}` + (e.margin ? ` - margin` : ``),
              subtitle: e.start_timestamp
                ? `${moment(e.start_timestamp).format('HH:mm:ss M/D')}`
                : `null`
            })
            // Because fb's list template MAX element count is 4,
            // we need to sent it immediately
            if (elements.length === 4) {
              promise = chatSendTemplateWithOrder('list', promise, elements, chat)
              elements = []
            }
          })

          if (elements.length)
            if (elements.length === 1)
              // Because fb's list template MIN element count is 2,
              // we need to send a generic template rather than the list one
              chatSendTemplateWithOrder('generic', promise, elements, chat)
            else chatSendTemplateWithOrder('list', promise, elements, chat)

          if (!hasElement) chat.say('No inactive markets!')
        })
        .catch(function(error) {
          chat.say(`Error occurred! Msg: ${error}`)
        })
    })
  })

  bot.on('postback:GET_DEFAULT_EXCHANGE_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      chat.say(`Your default exchange is set to ${userinfo.default_exchange}`)
    })
  })

  bot.on('postback:CHOOSE_DEFAULT_EXCHANGE_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      chat.say({
        text: 'Setting default exchange to:',
        buttons: userinfo.subscription.map(e => {
          return { type: 'postback', title: e, payload: 'SET_DEFAULT_EXCHANGE_PAYLOAD' }
        })
      })
    })
  })

  bot.on('postback:SET_DEFAULT_EXCHANGE_PAYLOAD', (payload, chat) => {
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      setTraderDefaultExchange(payload.sender.id, payload.postback.title)
      chat.say(`Your default exchange is set to ${payload.postback.title}`)
      for (let username in userlists)
        if (userlists[username].uid === payload.sender.id.toString())
          userlists[username]['default_exchange'] = payload.postback.title
    })
  })
}
