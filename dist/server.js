"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = __importDefault(require("socket.io"));
const Shrimpy = require('shrimpy-node');
const shrimpy_node_1 = require("shrimpy-node");
const PORT = process.env.PORT || 4000;
const publicKey = '11c3672476579235faf63748836a9d6e0e8ede0001ad9c4579c70e3bb7235fa3';
const privateKey = '8d4d30a2162281f796102c3eca6fc46055b399bd3a51e81e8888904a2922899159172404cb20b3064e861331793f22ef3936927aef83200b57eedf7f11e56580';
let realtime;
const app = express_1.default();
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.get('/', (req, res) => res.sendFile(__dirname + "/public/"));
var server = app.listen(PORT, () => console.log('Example app listening on port ' + PORT + '!'));
var web_socket = socket_io_1.default(server);
web_socket.on('connection', (socket) => {
    socket.on('trade', function (data) {
        syncTrade(data);
    });
    socket.on('order', function (data) {
        realtime = true;
        syncOrder(data);
    });
    socket.on('realtime', function (data) {
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
let errorHandler = (error) => { console.log(error); };
let api = new shrimpy_node_1.ShrimpyApiClient(publicKey, privateKey);
let client;
var cb_trade = (msg) => {
    // console.log('**************   trade   ************', msg); 
    // client.unsubscribe(unsubscribe_trade);
    if (realtime)
        web_socket.emit('trade', msg);
};
var cb_orderbook = (msg) => {
    //console.log('**************   orderbook   ************', msg); 
    client.unsubscribe({
        "type": "unsubscribe",
        "exchange": msg.exchange,
        "pair": msg.pair,
        "channel": "orderbook"
    });
    web_socket.emit('order', msg);
    if (realtime)
        setTimeout(function () {
            client.subscribe({
                "type": "subscribe",
                "exchange": msg.exchange,
                "pair": msg.pair,
                "channel": "orderbook"
            }, cb_orderbook);
        }, 3000);
};
init();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        let token = yield api.getToken();
        console.log('token', token);
        client = new shrimpy_node_1.ShrimpyWsClient(errorHandler, token);
        // declare the markets for subscribing and unsubscribing
        client.connect();
    });
}
function syncOrder(data) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('sync order');
        try {
            var price = 0.0;
            const ticker = yield api.getTicker('kucoin' // exchange
            );
            // console.log(ticker);
            ticker.forEach(function (item) {
                if (data.currency == 'eth-usd' && item.name == "Ethereum") {
                    price = parseFloat(item.priceUsd);
                }
                else if (data.currency == 'ltc-usd' && item.name == "Litecoin") {
                    price = parseFloat(item.priceUsd);
                }
            });
            let normalPrice = Math.ceil(price);
            web_socket.emit('price', normalPrice);
            for (var j = 0; j < exchanges.length; j++) {
                client.subscribe({
                    "type": "subscribe",
                    "exchange": exchanges[j],
                    "pair": data.currency,
                    "channel": "orderbook"
                }, cb_orderbook);
            }
        }
        catch (error) {
            console.log('********* order err');
            throw error;
        }
    });
}
var activeTrades;
function syncTrade(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            var price = 0.0;
            const ticker = yield api.getTicker('kucoin' // exchange
            );
            // console.log(ticker);
            ticker.forEach(function (item) {
                if (data.currency == 'eth-usd' && item.name == "Ethereum") {
                    price = parseFloat(item.priceUsd);
                }
                else if (data.currency == 'ltc-usd' && item.name == "Litecoin") {
                    price = parseFloat(item.priceUsd);
                }
            });
            let normalPrice = Math.ceil(price);
            for (var j = 0; j < exchanges.length; j++) {
                client.subscribe({
                    "type": "subscribe",
                    "exchange": exchanges[j],
                    "pair": data.currency,
                    "channel": "trade"
                }, cb_trade);
            }
        }
        catch (error) {
            console.log('********* trade err');
            throw error;
        }
    });
}
//# sourceMappingURL=server.js.map