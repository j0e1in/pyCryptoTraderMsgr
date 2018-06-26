'use strict'
const axios = require('axios')
const math = require('mathjs')
const moment = require('moment')
const { twoFactorAuthentication } = require('./utils')

/**
 * Authenticated Access
 */

const trader_url = process.env.TRADER_URL
const trader_port = process.env.TRADER_PORT
const trader_timeout = process.env.TRADER_REQUEST_TIMEOUT

module.exports.persistentMenuElements = {
  title: 'Auth Actions',
  type: 'nested',
  call_to_actions: [
    {
      title: 'Setters',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Set Log Level',
          type: 'postback',
          payload: 'SET_LOG_LEVEL_PAYLOAD'
        },
        {
          title: 'Set Max Fund',
          type: 'postback',
          payload: 'SET_MAX_FUND_PAYLOAD'
        }
      ]
    },
    {
      title: 'Markets',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Enable Market',
          type: 'postback',
          payload: 'ENABLE_MARKET_PAYLOAD'
        },
        {
          title: 'Disable Market',
          type: 'postback',
          payload: 'DISABLE_MARKET_PAYLOAD'
        }
      ]
    },
    {
      title: 'Trading',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Enable Trading',
          type: 'postback',
          payload: 'ENABLE_TRADING_PAYLOAD'
        },
        {
          title: 'Disable Trading',
          type: 'postback',
          payload: 'DISABLE_TRADING_PAYLOAD'
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
      logger.warn(`Non trader user: User=(${fb_user_id})`)
    }
  }

  bot.on('postback:SET_MAX_FUND_PAYLOAD', (payload, chat) => {
    const setMaxFundRespond = (payload, convo) => {
      const text = payload.message.text
      try {
        const number = math.number(text)
        axios
          .post(
            `${trader_url}:${trader_port}/trading/max_fund/${convo.get('userid')}`,
            {
              fund: number
            },
            {
              timeout: trader_timeout
            }
          )
          .then(function(response) {
            if (response.data.error) throw new Error(response.data.error)

            convo.say(`Max fund set to: ${number}`)
            convo.end()
          })
          .catch(function(error) {
            convo.say(`Error occurred! Msg: ${error.response.data}`)
            convo.end()
          })
      } catch (err) {
        convo.say('Please provide a valid float number!')
        convo.end()
      }
    }

    const setMaxFund = convo => {
      convo.ask(
        {
          text: 'Set max fund to:',
          quickReplies: ['200', '500', '1000', '1500', '2000']
        },
        setMaxFundRespond,
        [],
        {
          typing: true
        }
      )
    }

    checkUserBeforeContinue(payload.sender.id, userinfo => {
      chat.conversation(convo => {
        convo.set('userid', payload.sender.id)
        convo.set('username', userinfo.name)
        convo.set('subscriptions', userinfo.subscription)
        twoFactorAuthentication(convo, setMaxFund)
      })
    })
  })

  bot.on('postback:ENABLE_TRADING_PAYLOAD', (payload, chat) => {
    const enableTrading = convo => {
      axios
        .post(
          `${trader_url}:${trader_port}/trading/enable/${convo.get('userid')}`,
          {},
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          convo.say(`Trading enabled!`)
          convo.end()
        })
        .catch(function(error) {
          convo.say(`Error occurred! Msg: ${error.response.data}`)
          convo.end()
        })
    }
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      chat.conversation(convo => {
        convo.set('userid', payload.sender.id)
        convo.set('username', userinfo.name)
        convo.set('subscriptions', userinfo.subscription)
        twoFactorAuthentication(convo, enableTrading)
      })
    })
  })

  bot.on('postback:DISABLE_TRADING_PAYLOAD', (payload, chat) => {
    const disableTrading = convo => {
      axios
        .post(
          `${trader_url}:${trader_port}/trading/disable/${convo.get('userid')}`,
          {},
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)
          convo.say(`Trading disabled!`)
          convo.end()
        })
        .catch(function(error) {
          convo.say(`Error occurred! Msg: ${error.response.data}`)
          convo.end()
        })
    }
    checkUserBeforeContinue(payload.sender.id, userinfo => {
      chat.conversation(convo => {
        convo.set('userid', payload.sender.id)
        convo.set('username', userinfo.name)
        convo.set('subscriptions', userinfo.subscription)
        twoFactorAuthentication(convo, disableTrading)
      })
    })
  })

  bot.on('postback:ENABLE_MARKET_PAYLOAD', (payload, chat) => {
    const enableMarketsRespond = (payload, convo) => {
      const text = payload.message.text

      if (text === 'END' || text === 'end') {
        let markets = convo.get('markets')
        markets = Array.from(new Set(markets))
        if (!markets.length) {
          convo.say('No market choosen, leaving conversation.')
          convo.end()
          return
        }

        axios
          .post(
            `${trader_url}:${trader_port}/trading/markets/enable/${convo.get('userid')}/${convo.get(
              'default_exchange'
            )}`,
            {
              markets: markets
            },
            {
              timeout: trader_timeout
            }
          )
          .then(function(response) {
            if (response.data.error) throw new Error(response.data.error)

            convo.say(`Enabled markets: ${markets}`)
            convo.end()
          })
          .catch(function(error) {
            if (error.code == 'ECONNABORTED') convo.say(`Request Timeout!`)
            else convo.say(`Error occurred! Msg: ${error.response.data}`)
            convo.end()
          })
      } else if (text === 'MORE' || text === 'more') {
        axios
          .get(
            `${trader_url}:${trader_port}/account/info/${convo.get('userid')}/${convo.get(
              'default_exchange'
            )}`,
            {},
            {
              timeout: trader_timeout
            }
          )
          .then(function(response) {
            if (response.data.error) throw new Error(response.data.error)

            let msg = ''
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
              msg += `${e.symbol}\n`
            })

            if (!hasElement) convo.say('No inactive markets!')
            else convo.say(`Available markets:\n${msg}`)
            enableMarketsContinue(convo)
          })
          .catch(function(error) {
            convo.say(`Cannot get available market list! Msg: ${error}`)
            enableMarketsContinue(convo)
          })
      } else {
        let markets = convo.get('markets')
        markets.push(text)
        convo.set('markets', markets)
        enableMarketsContinue(convo)
      }
    }

    const enableMarkets = convo => {
      convo.ask(
        {
          text:
            'Which market do you want to enable? (type END to finish selection, MORE to show available market lists)',
          quickReplies: ['BTC/USD', 'ETH/USD', 'XRP/USD', 'BCH/USD', 'MORE']
        },
        enableMarketsRespond,
        [],
        {
          typing: true
        }
      )
    }

    const enableMarketsContinue = convo => {
      convo.ask(
        {
          text:
            'Do you want to enable some more? (type END to finish selection, MORE to show available market lists)',
          quickReplies: ['BTC/USD', 'ETH/USD', 'XRP/USD', 'BCH/USD', 'END']
        },
        enableMarketsRespond,
        [],
        {
          typing: true
        }
      )
    }

    checkUserBeforeContinue(payload.sender.id, userinfo => {
      chat.conversation(convo => {
        convo.set('userid', payload.sender.id)
        convo.set('username', userinfo.name)
        convo.set('default_exchange', userinfo.default_exchange)
        convo.set('subscriptions', userinfo.subscription)
        convo.set('markets', [])
        twoFactorAuthentication(convo, enableMarkets)
      })
    })
  })

  bot.on('postback:DISABLE_MARKET_PAYLOAD', (payload, chat) => {
    const disableMarketsRespond = (payload, convo) => {
      const text = payload.message.text

      if (text === 'END' || text === 'end') {
        let markets = convo.get('markets')
        markets = Array.from(new Set(markets))
        if (!markets.length) {
          convo.say('No market choosen, leaving conversation.')
          convo.end()
          return
        }

        axios
          .post(
            `${trader_url}:${trader_port}/trading/markets/disable/${convo.get(
              'userid'
            )}/${convo.get('default_exchange')}`,
            {
              markets: markets
            },
            {
              timeout: trader_timeout
            }
          )
          .then(function(response) {
            if (response.data.error) throw new Error(response.data.error)

            convo.say(`Disabled markets: ${markets}`)
            convo.end()
          })
          .catch(function(error) {
            if (error.code == 'ECONNABORTED') convo.say(`Request Timeout!`)
            else convo.say(`Error occurred! Msg: ${error.response.data}`)
            convo.end()
          })
      } else if (text === 'MORE' || text === 'more') {
        convo.say(`Available markets:\n${convo.get('active_markets').join('\n')}`)
        disableMarketsContinue(convo)
      } else {
        let markets = convo.get('markets')
        markets.push(text)
        convo.set('markets', markets)
        disableMarketsContinue(convo)
      }
    }

    const disableMarketsContinue = convo => {
      convo.ask(
        {
          text:
            'Do you want to disable some more? (type END to finish selection, MORE to show all active market lists)',
          quickReplies: convo
            .get('active_markets')
            .slice(0, 3)
            .concat(['MORE', 'END'])
        },
        disableMarketsRespond,
        [],
        {
          typing: true
        }
      )
    }

    const disableMarkets = convo => {
      axios
        .get(
          `${trader_url}:${trader_port}/account/info/${convo.get('userid')}/${convo.get(
            'default_exchange'
          )}`,
          {},
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          let promise
          let active_markets = []
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
            active_markets.push(e.symbol)
          })

          convo.set('active_markets', active_markets)

          convo.ask(
            {
              text:
                'Which market do you want to disable? (type END to finish selection, MORE to show all active market lists)',
              quickReplies: active_markets.slice(0, 3).concat(['MORE', 'END'])
            },
            disableMarketsRespond,
            [],
            {
              typing: true
            }
          )
        })
        .catch(function(error) {
          convo.say(
            `Cannot get active market lists, please provide market symbol manually! Msg: ${error}`
          )
          convo.ask(
            {
              text:
                'Which market do you want to disable? (type END to finish selection, MORE to show all active market lists)',
              quickReplies: ['MORE', 'END']
            },
            disableMarketsRespond,
            [],
            {
              typing: true
            }
          )
        })
    }

    checkUserBeforeContinue(payload.sender.id, userinfo => {
      chat.conversation(convo => {
        convo.set('userid', payload.sender.id)
        convo.set('username', userinfo.name)
        convo.set('default_exchange', userinfo.default_exchange)
        convo.set('subscriptions', userinfo.subscription)
        convo.set('markets', [])
        twoFactorAuthentication(convo, disableMarkets)
      })
    })
  })

  bot.on('postback:SET_LOG_LEVEL_PAYLOAD', (payload, chat) => {
    const SetLogLevelRespond = (payload, convo) => {
      const text = payload.message.text
      let level
      switch (text) {
        case 'debug':
        case 'warn':
        case 'error':
          level = text
          break
        case 'info':
        default:
          level = 'info'
          break
      }
      axios
        .post(
          `${trader_url}:${trader_port}/notification/log_level/${convo.get('userid')}`,
          {
            level: level
          },
          {
            timeout: trader_timeout
          }
        )
        .then(function(response) {
          if (response.data.error) throw new Error(response.data.error)

          convo.say(`Log level set to: ${level}`)
          convo.end()
        })
        .catch(function(error) {
          if (error.code == 'ECONNABORTED') convo.say(`Request Timeout!`)
          else convo.say(`Error occurred! Msg: ${error.response.data}`)
          convo.end()
        })
    }

    const setLogLevel = convo => {
      convo.ask(
        {
          text: 'Set log level to:',
          quickReplies: ['debug', 'info', 'warn', 'error']
        },
        SetLogLevelRespond,
        [],
        {
          typing: true
        }
      )
    }

    checkUserBeforeContinue(payload.sender.id, userinfo => {
      chat.conversation(convo => {
        convo.set('userid', payload.sender.id)
        convo.set('username', userinfo.name)
        convo.set('subscriptions', userinfo.subscription)
        twoFactorAuthentication(convo, setLogLevel)
      })
    })
  })
}
