'use strict';

module.exports = (bot) => {
    /**
     * Testing additional features
     */
    bot.hear('quick reply', (payload, chat) => {
        chat.say({
            text: 'Favorite color?',
            quickReplies: ['Red', 'Blue', 'Green']  
        })
    })

    bot.hear('image', (payload, chat) => {
        chat.say({
            attachment: 'image',
            url: '',
        })
    })

    bot.hear('generic', (payload, chat) => {
        chat.sendTemplate({
            "template_type": "generic",
            "elements": [
                {
                    "title": "Bitfinex balances",
                    "subtitle": "Bitfinex balances",
                },
            ]
            
        })
    })

    bot.hear('order', (payload, chat) => {
        chat.sendTemplate({
            "template_type":"receipt",
            "recipient_name":   "wayne",
            "order_number":     "1",
            "currency":         "USD", // symbol
            "payment_method":   "FUNDING",
            "timestamp":  "151654848",
            "elements": [
                {
                    "title": "Bitfinex - BTC/USD - MARGIN", // exchange + symbol + margin
                    "subtitle": "buy - 0.5", // side - amount
                    "price": 6578.26, 
                    "currency": "USD",
                },
                {
                    "title": "Bitfinex - BTC/USD - MARGIN", // exchange + symbol + margin
                    "subtitle": "buy - 0.5", // side - amount
                    "price": 6578.26, 
                    "currency": "USD",
                },
                {
                    "title": "Bitfinex - BTC/USD - MARGIN", // exchange + symbol + margin
                    "subtitle": "buy - 0.5", // side - amount
                    "price": 6578.26, 
                    "currency": "USD",
                },
            ],
            "summary": {
                "total_cost": "1231",
                "total_tax": "0"
            }

        })
    })

    bot.hear('carousel', (payload, chat) => {
        chat.sendTemplate({
            "template_type": "generic",
            "elements": [
                {
                    "title": "Bitfinex balances",
                    "subtitle": "Bitfinex balances",
                },
                {
                    "title": "USD: 155",
                    "subtitle": "qwdqwdqwd"
                },
                {
                    "title": "USD: 155",
                    "subtitle": "qwdqwdqwd"
                },
                {
                    "title": "USD: 155",
                    "subtitle": "qwdqwdqwd"
                },
            ]
            
        })
    })

    bot.hear('list', (payload, chat) => {
        chat.sendTemplate({
            "template_type": "list",
            "top_element_style": "compact",
            "elements": [
                {
                    "title": "Bitfinex balances",
                    "subtitle": "Bitfinex balances",
                },
                {
                    "title": "USD: 155",
                    "subtitle": "qwdqwdqwd"
                },
                {
                    "title": "USD: 155",
                    "subtitle": "qwdqwdqwd"
                },
                {
                    "title": "USD: 155",
                    "subtitle": "qwdqwdqwd"
                },
            ],
            "buttons": [

            ]            
        })
    })
    
    // bot.hear('generic template', (payload, chat) => {
    //     chat.say({
    //         cards: [
    //             { 
    //                 title: 'Card 1', image_url: 'https://i.imgur.com/eFSrcB7.jpg', default_action: {
    //                     "type": "web_url",
    //                     "url": "http://hello.com",
    //                     "messenger_extensions": false,
    //                 }
    //             },
    //             { 
    //                 title: 'Card 2', image_url: 'https://i.imgur.com/lY1nlZB.jpg', default_action: {
    //                     "type": "web_url",
    //                     "url": "http://hello.com",
    //                     "messenger_extensions": false,
    //                 } 
    //             }
    //         ]
    //     })
    // })
    


}