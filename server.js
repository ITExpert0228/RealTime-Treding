const publicKey = '11c3672476579235faf63748836a9d6e0e8ede0001ad9c4579c70e3bb7235fa3';
const privateKey = '8d4d30a2162281f796102c3eca6fc46055b399bd3a51e81e8888904a2922899159172404cb20b3064e861331793f22ef3936927aef83200b57eedf7f11e56580';
const Shrimpy = require('shrimpy-node');
const client = new Shrimpy.ShrimpyApiClient(publicKey, privateKey);

const express = require('express');
var io = require('socket.io');
var app = express();

app.use(express.static('public'));
app.get('/', function (req, res) {
   res.sendFile(__dirname + "/public/");
})

var server = app.listen(4000, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Trading App listening at http://%s:%s", host, port)
})

io = io.listen(3000);
io.on('connection', (socket) => {
    socket.on('join', function(data){
        syncInit(data);
    });
});

async function syncInit(data) {
    var orderBooks = {};
    const ticker = await client.getTicker(
        'kucoin' // exchange
    );
    orderBooks.ticker = ticker;
    for (var i=0; i<data.order.exchanges.length; i++) {
        var tmp = data.order.exchanges[i];
        orderBooks[tmp] = await client.getOrderBooks(
            tmp,  // exchange
            data.order.currency,      // baseSymbol
            'USD',      // quoteSymbol
            100          // limit
        );
    };
    
    io.emit('order', orderBooks);
    // const exchangeAssets = await client.getExchangeAssets('binance');
    // io.emit('exchangeAssets', exchangeAssets);
    // console.log('****   exchangeAssets    ');
    
    // const tradingPairs = await client.getTradingPairs('binance');
    // io.emit('tradingPairs', tradingPairs);
    // console.log('****   tradingPairs     ');
    
    // const ticker = await client.getTicker('binance');
    // io.emit('ticker', ticker);
    // console.log('****   kucoin     ');
}