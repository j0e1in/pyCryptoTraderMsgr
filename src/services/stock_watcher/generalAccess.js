'use strict'

module.exports.persistentMenuElements = {
  title: 'Actions',
  type: 'nested',
  call_to_actions: [
    {
      title: 'Stock Info',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Get stock info',
          type: 'postback',
          payload: 'BALANCE_PAYLOAD'
        },
        {
          title: 'Get stock market info',
          type: 'postback',
          payload: 'BALANCE_PAYLOAD'
        }
      ]
    },
    {
      title: 'Alerts',
      type: 'nested',
      call_to_actions: [
        {
          title: 'List all alerts',
          type: 'postback',
          payload: 'BALANCE_PAYLOAD'
        },
        {
          title: 'Set alert',
          type: 'postback',
          payload: 'BALANCE_PAYLOAD'
        },
        {
          title: 'Remove alert',
          type: 'postback',
          payload: 'BALANCE_PAYLOAD'
        }
      ]
    },
    {
      title: 'Tracking lists',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Add stock',
          type: 'postback',
          payload: 'BALANCE_PAYLOAD'
        },
        {
          title: 'Remove stock',
          type: 'postback',
          payload: 'BALANCE_PAYLOAD'
        }
      ]
    }
  ]
}
