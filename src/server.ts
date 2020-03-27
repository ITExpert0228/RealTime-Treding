import express from 'express';
import path from 'path';
import io from 'socket.io';
const Shrimpy = require('shrimpy-node');
import { ShrimpyApiClient, ShrimpyWsClient, ISubscriptionRequest, IWebsocketMessage,IExchangePairMessage, IErrorMessage } from 'shrimpy-node';
const PORT = process.env.PORT || 4000;
const publicKey = '11c3672476579235faf63748836a9d6e0e8ede0001ad9c4579c70e3bb7235fa3';
const privateKey = '8d4d30a2162281f796102c3eca6fc46055b399bd3a51e81e8888904a2922899159172404cb20b3064e861331793f22ef3936927aef83200b57eedf7f11e56580';

let realtime: boolean;

const app = express();

app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => res.sendFile(__dirname + "/public/"));

var server = app.listen(PORT, () => console.log('Example app listening on port '+PORT+'!'));
var web_socket = io(server);
web_socket.on('connection', (socket) => {    
    socket.on('trade', function(data){
        syncTrade(data);
    });
    socket.on('order', function(data){
        realtime = true;
        syncOrder(data);
    });
    socket.on('realtime', function(data){
        realtime = data;
    });
});

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

let errorHandler = (error: IErrorMessage) => { console.log(error) };
let api = new ShrimpyApiClient(publicKey, privateKey);
let client:any;

var cb_trade = (msg: IWebsocketMessage) => { 
    // console.log('**************   trade   ************', msg); 
    // client.unsubscribe(unsubscribe_trade);
    if (realtime) web_socket.emit('trade', msg);
};

var cb_orderbook = (msg: IExchangePairMessage) => { 
    //console.log('**************   orderbook   ************', msg); 
    client.unsubscribe({
        "type": "unsubscribe",
        "exchange": msg.exchange,
        "pair": msg.pair,
        "channel": "orderbook"
    });
    web_socket.emit('order', msg);
    if (realtime)
        setTimeout(function(){
            client.subscribe({
                "type": "subscribe",
                "exchange": msg.exchange,
                "pair": msg.pair,
                "channel": "orderbook"
            }, cb_orderbook);
        }, 3000);
};

init();
async function init() {
    let token: any = await api.getToken();
    console.log('token', token);
    client = new ShrimpyWsClient(errorHandler, token);
    // declare the markets for subscribing and unsubscribing
    client.connect();
}

async function syncOrder(data:any) {
    console.log('sync order');
    try {
        var price = 0.0;
        const ticker = await api.getTicker(
            'kucoin' // exchange
        );
        // console.log(ticker);
        ticker.forEach(function(item:any){
            if (data.currency == 'eth-usd' && item.name == "Ethereum") {
                price = parseFloat(item.priceUsd);
            } else if (data.currency == 'ltc-usd' && item.name == "Litecoin") {
                price = parseFloat(item.priceUsd);
            }
        });
        
        let normalPrice = Math.ceil(price);
        web_socket.emit('price', normalPrice);

        for (var j=0; j<exchanges.length; j++) {
            client.subscribe({
                "type": "subscribe",
                "exchange": exchanges[j],
                "pair": data.currency,
                "channel": "orderbook"
            }, cb_orderbook);
        }  
    } catch (error) {
        console.log('********* order err');
        throw error
    }
}

var activeTrades:any;
async function syncTrade(data:any) {
    try {
        var price = 0.0;
        const ticker = await api.getTicker(
            'kucoin' // exchange
        );
        // console.log(ticker);
        ticker.forEach(function(item:any){
            if (data.currency == 'eth-usd' && item.name == "Ethereum") {
                price = parseFloat(item.priceUsd);
            } else if (data.currency == 'ltc-usd' && item.name == "Litecoin") {
                price = parseFloat(item.priceUsd);
            }
        });

        let normalPrice = Math.ceil(price);

        for (var j=0; j<exchanges.length; j++) {
            client.subscribe({
                "type": "subscribe",
                "exchange": exchanges[j],
                "pair": data.currency,
                "channel": "trade"
            }, cb_trade);
        }
    } catch (error) {
        console.log('********* trade err');
        throw error
    }
}