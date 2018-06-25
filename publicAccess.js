/**
 * 不需要2FA認證就能存取的帳戶資料
 * 
 * 
 * Account
 *  - Balance: 
 *    - Total: 帳戶內有多少＄
 *    - CEX:
 *    - BITFINEX:
 *  - Summary: 
 *    - Total: 過去n筆交易紀錄
 *    - CEX: 
 *    - BITFINEX:
 *  - Order
 *    - Limit
 *       - Total: 目前Limit Market的單
 *       - CEX:
 *       - BITFINEXT:
 *    - Margin
 *       - Total: 目前Margin Trade的單
 *       - CEX:
 *       - BITFINEXT:
 */


exports.account = class {
    constructor() {
        this.accountOptions = {
            "nested" : {
                ""
            },
            "flat": {

            }
        }
    }





}