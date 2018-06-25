'use strict'

const BootBot = require('bootbot')
const authAccessModule = require('../authAccess').module
const generalAccessModule = require('../generalAccess').module

const generalAccessPersistentMenuElement = require('../generalAccess').persistentMenuElements
const authAccessPersistentMenuElement = require('../authAccess').persistentMenuElements

class PageBot {
  constructor(name, fb_app_secret, fb_access_token, fb_verify_token) {
    console.log(`Constructing PageBot: ${name}`)
    if (!name || !fb_app_secret || !fb_access_token || !fb_verify_token)
      throw new Error('missing arguments!')

    this.name = name
    this.fb_app_secret = fb_app_secret
    this.fb_access_token = fb_access_token
    this.fb_verify_token = fb_verify_token
  }

  createBot() {
    this.bot = new BootBot({
      accessToken: this.fb_access_token,
      verifyToken: this.fb_verify_token,
      appSecret: this.fb_app_secret
    })

    this.bot.setPersistentMenu([
      generalAccessPersistentMenuElement,
      authAccessPersistentMenuElement
    ])

    this.bot.module(authAccessModule)
    this.bot.module(generalAccessModule)
  }

  /**
   * For first time setup use
   */
  getUserId() {
    // TODO:
  }

  broadcast(msg) {
    // TODO:
    this.bot.say(uid, msg)
  }
}

module.exports = PageBot
