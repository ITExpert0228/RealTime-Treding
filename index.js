const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => res.sendFile(__dirname + "/public/"));
var server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

const exchanges = [
    "binance",
    "binanceus",
    "bittrex",
    "bittrexinternational",
    "kucoin",
    "coinbasepro",
    "poloniex",
    "kraken",
    "bibox",
    "gemini",
    "huobiglobal",
    "hitbtc",
    "bitmart",
    "bitstamp",
    "okex",
    "bitfinex"
];

const publicKey = '11c3672476579235faf63748836a9d6e0e8ede0001ad9c4579c70e3bb7235fa3';
const privateKey = '8d4d30a2162281f796102c3eca6fc46055b399bd3a51e81e8888904a2922899159172404cb20b3064e861331793f22ef3936927aef83200b57eedf7f11e56580';
const Shrimpy = require('shrimpy-node');
const client = new Shrimpy.ShrimpyApiClient(publicKey, privateKey);

var io = require('socket.io');
io = io(server);
io.on('connection', (socket) => {
    socket.on('trade', function(data){
        syncTrade(data);
    });
    socket.on('order', function(data){
        syncOrder(data);
    });
});

const userid = '201b0f5e-2992-4475-a5e5-f2c079218c98';
var activeTrades;
async function syncTrade(data) {
    try {
        var currency = data.currency;
        console.log('currency-', currency);
        // const accounts = await client.getAccounts( userid );
        const accounts = [
            {
                "id": 123,
                "exchange": "Kucoin",
                "isRebalancing": true,
                "exchangeApiErrors": []
            },
            {
                "id": 456,
                "exchange": "Binance",
                "isRebalancing": false,
                "exchangeApiErrors": []
            }
        ];
        activeTrades = {};
        for (var i=0; i<accounts.length; i++) {
            // const trades = await client.getActiveTrades(
            //     userid,
            //     accounts[i].id
            // );
            var trades = [
                {
                    "id": "72dff099-54c0-4a32-b046-5c19d4f55758",
                    "fromSymbol": "LTC",
                    "toSymbol": "ETH",
                    "amount": 13.0000000000000000,
                    "status": "queued",
                    "success": false,
                    "errorCode": 0,
                    "errorMessage": "",
                    "exchangeApiErrors": [],
                    "smartRouting": false,
                    "maxSpreadPercent": "10",
                    "maxSlippagePercent": "10",
                    "triggeredMaxSpread": false,
                    "triggeredMaxSlippage": false
                },
                {
                    "id": "72dff099-54c0-4a32-b046-5c19d4f55758",
                    "fromSymbol": "ETH",
                    "toSymbol": "LTC",
                    "amount": "15.27",
                    "status": "started",
                    "success": false,
                    "errorCode": 0,
                    "errorMessage": "",
                    "exchangeApiErrors": [],
                    "smartRouting": false,
                    "maxSpreadPercent": "10",
                    "maxSlippagePercent": "10",
                    "triggeredMaxSpread": false,
                    "triggeredMaxSlippage": false
                }
            ];
            // trades.forEach(function(trade){
            addTrade(accounts[i], trades, currency);
            // })
        }
        io.emit('trade', activeTrades);
    } catch (error) {
        console.log('********* trade err');
        throw error
    }
}

async function syncOrder(data) {
    try {
        var orderBooks = [];
        var price = 0.0;
        const ticker = await client.getTicker(
            'kucoin' // exchange
        );
        ticker.forEach(function(item){
            if (data.currency == 'ETH' && item.name == "Ethereum") {
                price = parseFloat(item.priceUsd);
            } else if (data.currency == 'LTC' && item.name == "Litecoin") {
                price = parseFloat(item.priceUsd);
            }
        });
        var normalPrice = Math.ceil(price);

        for (var i=0; i<exchanges.length; i++) {
            var tmp = exchanges[i];
            var books = await client.getOrderBooks(
                tmp,
                data.currency,      // baseSymbol
                'USD',      // quoteSymbol
                100          // limit
            );
            orderBooks.push(books);
        };
        console.log('price', price);
        io.emit('order', orderBooks);   
    } catch (error) {
        console.log('********* order err');
        throw error
    }
}

function addTrade(account, trades, currency) {
    var totalBuy = 0;
    var totalSell = 0;

    trades.forEach(function(data){
        if (data.fromSymbol == currency) {
            totalSell += parseFloat(data.amount);
        } else if (data.toSymbol == currency) {
            totalBuy += parseFloat(data.amount);
        }
    })

    // console.log('added trade', totalBuy, totalSell);
    
    var key = account.exchange.toLowerCase();
    if (activeTrades[key]) {
        activeTrades[key].buy = totalBuy;
        activeTrades[key].sell = totalSell;
    } else {
        activeTrades[key] = {buy: totalBuy, sell: totalSell}
    }
}