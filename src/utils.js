'use strict'

const fs = require('fs')
const AccountData = JSON.parse(fs.readFileSync(process.env.ACCOUNT_CREDENTIAL, 'utf8'))

const checkRequestMiddleware = (req, res, next) => {
    if (req.body.signature !== 'trader') {
        return
    }

    return next()
}

const setTraderDefaultExchange = (fb_user_id, exchange) => {
    if (AccountData['accounts'][fb_user_id] !== undefined &&
        AccountData['accounts'][fb_user_id].default_exchange !== exchange
    ) {
        AccountData['accounts'][fb_user_id].default_exchange = exchange
        writeToAccount()
    }
}

const writeToAccount = () => {
    fs.writeFileSync(process.env.ACCOUNT_CREDENTIAL, JSON.stringify(AccountData), 'utf8')
}

const twoFactorAuthentication = (convo, cb) => {
    convo.say(`Further action require authy authentication!`).then(() => cb(convo))
}

const chatSay = (msg, promise, chat) => {
    if (!promise)
        return chat.say(msg)
    else
        return promise.then(() => chat.say(msg))
}

const botSendTemplateWithOrder = (type, promise, elements, bot, user_id) => {
    let template
    switch (type) {
        case 'generic':
            template = {
                "template_type": type,
                "elements": elements
            }
            break
        case 'list':
            template = {
                "template_type": 'list',
                "top_element_style": "compact",
                "elements": elements
            }
            break
        case 'msg':
        default:
            if (!promise)
                return bot.say(user_id, elements)
            else
                return promise.then(() => bot.say(user_id, elements))
            break
    }

    if (!promise)
        return bot.sendTemplate(user_id, template)
    else
        return promise.then(() => bot.sendTemplate(user_id, template))
}

const chatSendTemplateWithOrder = (type, promise, elements, chat) => {
    let template
    switch (type) {
        case 'generic':
            template = {
                "template_type": type,
                "elements": elements
            }
            break
        case 'list':
            template = {
                "template_type": 'list',
                "top_element_style": "compact",
                "elements": elements,
            }
            break
        case 'msg':
        default:
            if (!promise)
                return chat.say(elements)
            else
                return promise.then(() => chat.say(elements))
            break
    }

    if (!promise)
        return chat.sendTemplate(template)
    else
        return promise.then(() => chat.sendTemplate(template))
}

const absolutePath = (origin, proj_root) => {
    if (!typeof origin == 'String')
        origin = String(origin)
    if (!typeof proj_root == 'String')
        proj_root = String(proj_root)
    if (proj_root.slice(-1) !== '/')
        proj_root += '/'

    if (origin[0] === '/')
        return origin
    else
        return proj_root + origin
}

module.exports = {
    'chatSay': chatSay,
    'botSendTemplateWithOrder': botSendTemplateWithOrder,
    'chatSendTemplateWithOrder': chatSendTemplateWithOrder,
    'checkRequestMiddleware': checkRequestMiddleware,
    'twoFactorAuthentication': twoFactorAuthentication,
    'setTraderDefaultExchange': setTraderDefaultExchange,
    'absolutePath': absolutePath,
}