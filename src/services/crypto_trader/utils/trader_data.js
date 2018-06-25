'use strict';

const axios = require('axios');

const trader_url = process.env.TRADER_URL;
const trader_port = process.env.TRADER_PORT;
const trader_timeout = process.env.TRADER_REQUEST_TIMEOUT;

module.exports.getActiveMarkets = ( uid, exchange, cb ) => {
    axios.get(`${trader_url}:${trader_port}/account/info/${uid}/${exchange}`,{}, {
        timeout: trader_timeout
    })
    .then(function(response) { 
        if ( response.data.error )
            throw new Error(response.data.error);

        response.data.active_markets.sort((a, b) => {
            let aa = a.symbol.split('/')[1];
            let bb = b.symbol.split('/')[1];
            return aa > bb ? 1 : ( aa === bb ? 0 : -1 );
        })

        response.data.active_markets.sort((a, b) => {
            let aa = a.symbol.split('/')[0];
            let bb = b.symbol.split('/')[0];
            return aa > bb ? 1 : ( aa === bb ? 0 : -1 );
        })

        cb( null, response.data.active_markets );
        
    })
    .catch(function(error) {
        cb(`Error occurred! Msg: ${error}`);
    })
}

module.exports.getActivePositions = ( uid, exchange, cb ) => {
    axios.get(`${trader_url}:${trader_port}/account/active/positions/${uid}/${exchange}`,{
        "headers": {
            // "dummy-data": true
        }
    }, {
        timeout: trader_timeout
    })
    .then(function(response) {
        if ( response.data.error )
            throw new Error(response.data.error);

        response.data.positions.sort((a, b) => {
            return a.price > b.price ? 1 : ( a.price === b.price ? 0 : -1 );
        }).sort((a, b) => {
            return a.side > b.side ? 1 : ( a.side === b.side ? 0 : -1 );
        }).sort((a, b) => {
            return a.symbol > b.symbol ? 1 : ( a.symbol === b.symbol ? 0 : -1 );
        })

        cb(null, response.data.positions)
            
    })
    .catch(function(error) {
        cb(`Error occurred! Msg: ${error}`)
    })
}


