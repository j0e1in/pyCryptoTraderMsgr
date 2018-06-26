'use strict'

const BootBot = require('bootbot')

// Stock watcher modules
const stockWatcherMenu = require('../services/stock_watcher/generalAccess').persistentMenuElements

// Crypto trader modules
const getStartedProcess = require('../services/crypto_trader/getStartedProcess').module
const authAccessModule = require('../services/crypto_trader/authAccess').module
const generalAccessModule = require('../services/crypto_trader/generalAccess').module
const logger = require('../logger')

class PageBot {
  constructor(
    name,
    user_lists,
    fb_app_secret,
    fb_access_token,
    fb_verify_token,
    subscribed_service
  ) {
    if (!name || !user_lists || !fb_app_secret || !fb_access_token || !fb_verify_token)
      throw new Error('missing arguments!')

    this.name = name
    this.user_lists = user_lists
    this.fb_app_secret = fb_app_secret
    this.fb_access_token = fb_access_token
    this.fb_verify_token = fb_verify_token
    this.subscribed_service = subscribed_service
    this.botPersistentMenu = []
    this.lastServiceName
    this.createBot()
  }

  createBot() {
    this.bot = new BootBot({
      accessToken: this.fb_access_token,
      verifyToken: this.fb_verify_token,
      appSecret: this.fb_app_secret
    })

    this._addPersistentMenu(this.subscribed_service)

    this.subscribed_service.forEach(service_name => {
      this._subscribeService(service_name)
    })

    this.bot.setPersistentMenu(this.botPersistentMenu)
  }

  /**
   * For first time setup use
   */
  getUserId() {
    // TODO:
  }

  getBot() {
    return this.bot
  }

  notify(username, notify_type, data) {
    // purpose ???
    logger.debug(`Notifying ${username} - ${this.user_lists[username].uid}`)
  }

  broadcast(msg, level = 0) {
    for (let username in this.user_lists)
      if (level <= this.user_lists[username].perm) this.bot.say(this.user_lists[username].uid, msg)
  }

  handlePostData(data) {
    this.bot.handleFacebookData(data)
  }

  // FIXME:
  _addPersistentMenu() {
    let service_count = this.subscribed_service.length
    let servicePersistentMenu
    let serviceMenuName

    this.subscribed_service.forEach(service_name => {
      switch (service_name) {
        case 'stock_watcher':
          serviceMenuName = 'Stock Watcher'
          if (service_count > 1) {
            stockWatcherMenu.title = `[${serviceMenuName}] ${stockWatcherMenu.title}`
          }
          servicePersistentMenu = [stockWatcherMenu]
          break
        case 'crypto_trader':
        default:
          const cryptoGeneralAccessPersistentMenuElement = require('../services/crypto_trader/generalAccess').createPersistentMenuElements()
          const cryptoAuthAccessPersistentMenuElement = require('../services/crypto_trader/authAccess').createPersistentMenuElements()

          serviceMenuName = 'Crypto Trader'
          if (service_count > 1) {
            cryptoGeneralAccessPersistentMenuElement.title = `[${serviceMenuName}] ${
              cryptoGeneralAccessPersistentMenuElement.title
            }`
            cryptoAuthAccessPersistentMenuElement.title = `[${serviceMenuName}] ${
              cryptoAuthAccessPersistentMenuElement.title
            }`
          }

          servicePersistentMenu = [
            cryptoGeneralAccessPersistentMenuElement,
            cryptoAuthAccessPersistentMenuElement
          ]

          break
      }

      if (
        this.botPersistentMenu.length + servicePersistentMenu.length < 4 &&
        this.botPersistentMenu.length === 0
      ) {
        this.botPersistentMenu = servicePersistentMenu
      } else if (this.botPersistentMenu.length + servicePersistentMenu.length < 4) {
        this.botPersistentMenu = this.botPersistentMenu.concat(servicePersistentMenu)
      } else {
        logger.error(`Must not bind more than 3 persistent menu on the top level! Page name:${this.name}`)
      }
    })

    this.lastServiceName = serviceMenuName
  }

  _subscribeService(service_name) {
    switch (service_name) {
      case 'stock_watcher':
        break
      case 'crypto_trader':
      default:
        getStartedProcess.apply(this.bot, [this.bot])
        authAccessModule.apply(this.bot, [this.bot, this.user_lists])
        generalAccessModule.apply(this.bot, [this.bot, this.user_lists])
        break
    }
  }
}

module.exports = PageBot
