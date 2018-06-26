'use strict'

const axios = require('axios')
const math = require('mathjs')
const moment = require('moment')
const { inspect } = require('util')
const logger = require('../../logger')

const trader_url = process.env.TRADER_URL
const trader_port = process.env.TRADER_PORT
const trader_timeout = process.env.TRADER_REQUEST_TIMEOUT

module.exports.module = bot => {
  bot.setGreetingText('Hello!')

  bot.setGetStartedButton('GET_STARTED_PATLOAD')

  bot.on('postback:GET_STARTED_PATLOAD', (payload, chat) => {
    chat.say('Starting initial setting process...\nRegistering authy account').then(() => {
      const askEmail = convo => {
        convo.ask(`What's your email?`, (payload, convo) => {
          const text = payload.message.text
          convo.set('email', text)
          askPhone(convo)
        })
      }

      const askPhone = convo => {
        convo.ask(`What's your phone number?`, (payload, convo) => {
          const text = payload.message.text
          convo.set('phone', text)
          askCountryCode(convo)
        })
      }

      const askCountryCode = convo => {
        const answer = (payload, convo) => {
          const text = payload.message.text

          switch (text) {
            case 'OK':
              convo.say(`Registering authy account...`).then(() => {
                registerAuthy(convo)
              })
              break
            case 'RESET':
            default:
              convo.say(`Resetting supplied information`).then(() => {
                askEmail(convo)
              })
              break
          }
        }

        const options = {
          typing: true // Send a typing indicator before asking the question
        }

        convo.ask(`What's your country code (ex:886)?`, (payload, convo) => {
          const text = payload.message.text
          convo.set('countryCode', text)
          convo.ask(
            {
              text: `This is your authy information, please confirm:\nEmail:${convo.get(
                'email'
              )}\nPhone:${convo.get('phone')}\nCountry code:${convo.get('countryCode')}`,
              quickReplies: ['OK', 'RESET']
            },
            answer,
            [],
            options
          )
        })
      }

      const registerAuthy = convo => {
        const askTraderExchange = convo => {
          convo.ask(
            {
              text: `What's your exchange?`,
              quickReplies: ['bitfinex'] // TODO:
            },
            (payload, convo) => {
              const text = payload.message.text
              convo.set('exchange', 'bitfinex')
              askTraderUsername(convo) // bitfinex user email
            }
          )
        }

        const askTraderUsername = convo => {
          convo.ask(`What's your exchange username?`, (payload, convo) => {
            const text = payload.message.text
            convo.set('exchange_username', text)
            askAuthLevel(convo) // bitfinex user email
          })
        }

        const registerTrader = convo => {
          axios
            .post(
              `${trader_url}:${trader_port}/register/account`,
              {
                uid: convo.get('fb_uid'),
                exchange: convo.get('exchange'),
                exchange_username: convo.get('exchange_username'),
                auth_level: convo.get('authLevel') === 'primary' ? 1 : 2
              },
              {
                timeout: trader_timeout
              }
            )
            .then(function(response) {
              logger.debug(response)
              if (!response.data.error)
                convo.say(`Trader user created!\nInitial setup completed!`).then(() => {
                  convo.end()
                })
              else
                convo
                  .say(`Error creating trader user! Error: ${inspect(response.data.error)}`)
                  .then(() => {
                    convo.say('Restarting trader registration process').then(() => {
                      askTraderExchange(convo)
                    })
                  })
            })
            .catch(function(error) {
              logger.error(error)
              convo.say(`Some error happened! Conversation ended!`)
              convo.end()
            })
        }

        const askAuthLevel = convo => {
          const tradingAnswer = (payload, convo) => {
            const text = payload.message.text

            switch (text) {
              case 'OK':
                convo.say(`Registering trading account...`).then(() => {
                  registerTrader(convo)
                })
                break
              case 'RESET':
              default:
                convo.say(`Resetting supplied information`).then(() => {
                  askTraderExchange(convo)
                })
                break
            }
          }

          const options = {
            typing: true // Send a typing indicator before asking the question
          }

          convo.ask(
            {
              text: `What's your auth level`,
              quickReplies: ['primary owner', 'secondary owner']
            },
            (payload, convo) => {
              const text = payload.message.text
              switch (text) {
                case 'secondary owner':
                  convo.set('authLevel', 'secondary')
                  break
                case 'primary owner':
                default:
                  convo.set('authLevel', 'primary')
                  break
              }

              convo.ask(
                {
                  text: `This is your trader information, please confirm:\nExchange:${convo.get(
                    'exchange'
                  )}\nExchange username:${convo.get('exchange_username')}\nAuth level:${convo.get(
                    'authLevel'
                  )}`,
                  quickReplies: ['OK', 'RESET']
                },
                tradingAnswer,
                [],
                options
              )
            }
          )
        }

        axios
          .post(
            `${trader_url}:${trader_port}/register/authy`,
            {
              uid: convo.get('fb_uid'),
              email: convo.get('email'),
              phone: convo.get('phone'),
              country_code: convo.get('countryCode')
            },
            {
              timeout: trader_timeout
            }
          )
          .then(function(response) {
            logger.debug(response)
            if (!response.data.error)
              convo.say(`Authy created!\nRegistering trading info`).then(() => {
                askTraderExchange(convo)
              })
            else
              convo
                .say(`Error registering authy! Error: ${inspect(response.data.error)}`)
                .then(() => {
                  convo.say('Restarting authy registration process').then(() => {
                    askEmail(convo)
                  })
                })
          })
          .catch(function(error) {
            logger.error(error)
            convo.say(`Some error happened! Conversation ended!`)
            convo.end()
          })
      }

      chat.conversation(convo => {
        convo.set('fb_uid', payload.sender.id)
        askEmail(convo)
      })
    })
  })
}
