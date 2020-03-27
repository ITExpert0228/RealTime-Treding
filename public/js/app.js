var socket = io();
var exchanges = [
    {exchange: "binance", url: "binance.com"},
    {exchange: "binanceus", url: "binance.us"},
    {exchange: "bittrex", url: "bittrex.com"},
    {exchange: "bittrexinternational", url: "bittrexinternational.com"},
    {exchange: "kucoin", url: "kucoin.com"},
    {exchange: "coinbasepro", url: "pro.coinbase.com"},
    {exchange: "poloniex", url: "poloniex.com"},
    {exchange: "kraken", url: "kraken.com"},
    {exchange: "bibox", url: "bibox.com"},
    {exchange: "gemini", url: "gemini.com"},
    {exchange: "huobiglobal", url: "hbg.com"},
    {exchange: "hitbtc", url: "hitbtc.com"},
    {exchange: "bitmart", url: "bitmart.com"},
    {exchange: "bitstamp", url: "bitstamp.net"},
    {exchange: "okex", url: "okex.com"},
    {exchange: "bitfinex", url: "bitfinex.com"}
];

var currentLevel = 5;
var currentPrice = 0;
var dataOrder1 = {};
var dataOrder2 = {};
var dataTrade = {};

// var old_level = localStorage.getItem('level');
// var old_trade_currency = localStorage.getItem('trade_currency');
// var old_trade_exchange = localStorage.getItem('trade_exchange');
// var old_order_currency = localStorage.getItem('order_currency');
// var old_order_exchange = localStorage.getItem('order_exchange');

// if ('order_currency' in localStorage) {
//     $('#level').val(4);
//     $('#sel-currency').val('eth-usd');
//     $('#sel-currency1').val('eth-usd');
// } else {
//     $('#level').val(old_level);
//     $('#sel-currency').val(old_trade_currency);
//     $('#sel-currency1').val(old_order_currency);
// }


function prepareTrade() {
    var tradeCurrency = $('#sel-currency').val();
    var tradeExchanges = $.map($("#sel1 input[type='checkbox']:checked"), function(c){
        if (!c.value) return null;
        return c.value
    });
    localStorage.setItem('trade_currency', tradeCurrency);
    localStorage.setItem('trade_exchange', tradeExchanges);
    return {currency: tradeCurrency, exchanges: tradeExchanges}
}

function prepareOrder() {
    var orderCurrency = $('#sel-currency1').val();
    var orderExchanges = $.map($("#sel2 input[type='checkbox']:checked"), function(c){
        if (!c.value) return null;
        return c.value
    });
    var currentLevel = parseInt($('#level').val());
    if (currentLevel > 5 || currentLevel <= 0) currentLevel = 5;
    localStorage.setItem('level', currentLevel);
    localStorage.setItem('order_currency', orderCurrency);
    localStorage.setItem('order_exchange', orderExchanges);
    return {currency: orderCurrency, exchanges: orderExchanges, level: currentLevel}
}
    
$("body").loading('start');
socket.emit('trade', prepareTrade());
socket.emit('order', prepareOrder());

socket.on('connect', function(){
    console.log('connected');
});

socket.on('general', function(assets){
    console.log('assets', assets);
});

socket.on('pairs', function(pairs){
    console.log('pair', pairs);
});

socket.on('price', function(price){
    console.log('price', price);
    $('#currentPrice').text(price);
    currentPrice = price;
    $('#aboveGrid tr').each(function(){
        if ($(this).data('key')) {
            for (var i=0; i<currentLevel; i++) {
                $(this).children('td').eq(i*3+1).text(price+i+1);
            }
        }
    });
    $('#belowGrid tr').each(function(){
        if ($(this).data('key')) {
            for (var j=0; j<currentLevel; j++) {
                $(this).children('td').eq(j*3+1).text(price-j);
            }
        }
    })
});

socket.on('order', function(orders) {
    console.log(orders);
    $("body").loading('stop');
    var calc = [];
    var below = [];
    for (var i=0; i<currentLevel; i++) {
        calc[i] = {price: 0.0, buy: 0, sell: 0, count: 0, obj: []};
        below[i] = {price: 0.0, buy: 0, sell: 0, count: 0, obj: []};
    }
    orders.content.asks.forEach(function(ask){
        var level = Math.floor(ask.price - currentPrice);
        if (level < currentLevel && level >= 0) {
            calc[level].buy += parseFloat(ask.quantity);
            calc[level].price += parseFloat(ask.price);
            calc[level].count ++;
            calc[level].obj.push(ask);
        }

        var blevel = Math.floor(currentPrice - ask.price);
        if (blevel < currentLevel && blevel >= 0) {
            below[blevel].buy += parseFloat(ask.quantity);
            below[blevel].price += parseFloat(ask.price);
            below[blevel].count ++;
            below[blevel].obj.push(ask);
        }
    });
    orders.content.bids.forEach(function(bid){
        var level = Math.floor(bid.price - currentPrice);
        if (level < currentLevel && level >= 0) {
            calc[level].sell += parseFloat(bid.quantity);
            calc[level].price += parseFloat(bid.price);
            calc[level].count ++;
            calc[level].obj.push(bid);
        }

        var blevel = Math.floor(currentPrice - bid.price);
        if (blevel < currentLevel && blevel >= 0) {
            below[blevel].sell += parseFloat(bid.quantity);
            below[blevel].price += parseFloat(bid.price);
            below[blevel].count ++;
            below[blevel].obj.push(bid);
        }
    });

    dataOrder1[orders.exchange] = calc;
    dataOrder2[orders.exchange] = below;
    $('#aboveGrid tr').each(function(){
        if ($(this).data('key') == orders.exchange) {
            for (var level=0; level<calc.length; level++) {
                $(this).children('td').eq(level*3+2).text(parseInt(calc[level].buy));
                $(this).children('td').eq(level*3+3).text(parseInt(calc[level].sell));
            }
        }
    });
    $('#belowGrid tr').each(function(){
        if ($(this).data('key') == orders.exchange) {
            for (var level=0; level<below.length; level++) {
                $(this).children('td').eq(level*3+2).text(parseInt(below[level].buy));
                $(this).children('td').eq(level*3+3).text(parseInt(below[level].sell));
            }
        }
    })
    statistic();
});

socket.on('trade', function(trades) {
    console.log(trades);
    if (!dataTrade[trades.exchange]) dataTrade[trades.exchange] = {buy: 0.0, sell: 0.0};
    trades.content.forEach(function(trade){
        if (trade.takerSide == 'seller') {
            dataTrade[trades.exchange].sell += parseFloat(trade.quantity);
        } else {
            dataTrade[trades.exchange].buy += parseFloat(trade.quantity);
        }
    });

    var currency = $('#sel-currency').val().substring(0, 3).toUpperCase();
    $('#exchange tr').each(function(){
        if ($(this).data('key') == trades.exchange) {
            $(this).children('td').eq(1).text(dataTrade[trades.exchange].buy.toFixed(2)+" "+currency);
            $(this).children('td').eq(2).text(dataTrade[trades.exchange].sell.toFixed(2)+" "+currency);
        }
    });
    trade_statistic();
    // var exchange;
    // var tradeCurrency = $('#sel-currency').val();

    // $('#exchange tbody tr').each(function(){
    //     $(this).find('td').eq(1).text('-').data('val', 0);
    //     $(this).find('td').eq(2).text('-').data('val', 0);
    // })

    // for (exchange in trades) {
    //     $('#exchange tbody tr').each(function(){
    //         if ($(this).data('key') === exchange) {
    //             $(this).find('td').eq(1).text(trades[exchange].buy+' '+tradeCurrency).data('val', trades[exchange].buy);
    //             $(this).find('td').eq(2).text(trades[exchange].sell+' '+tradeCurrency).data('val', trades[exchange].sell);
    //         }
    //     })
    // }

    // refreshTotalTrade();
    
});

function statistic() {
    var currency = $('#sel-currency1').val().substring(0, 3).toUpperCase();
    var average1 = [];
    for (exchange in dataOrder1) {
        var tmp = dataOrder1[exchange];
        $('#aboveGrid tr').each(function(){
            if ($(this).data('key') == exchange && !$(this).hasClass('hide')) {
                for (var level=0; level<tmp.length; level++) {
                    if (!average1[level]) average1[level] = {avg: parseInt(currentPrice), buy: 0, sell: 0};
                    if (tmp[level].price > 0 && tmp[level].count > 0)
                        average1[level].avg = (average1[level].avg + tmp[level].price/tmp[level].count) / 2.0;
                    average1[level].buy += tmp[level].buy;
                    average1[level].sell += tmp[level].sell;
                }     
            }
        });
    }
    average1.forEach(function(data, index){
        $('#aboveGrid .statistic').children('td').eq(index*3+1).text(data.avg.toFixed(2));
        $('#aboveGrid .statistic').children('td').eq(index*3+2).text(parseInt(data.buy)+' '+currency);
        $('#aboveGrid .statistic').children('td').eq(index*3+3).text(parseInt(data.sell)+' '+currency);
    });

    var average2 = [];
    for (exchange in dataOrder2) {
        var tmp = dataOrder2[exchange];
        $('#belowGrid tr').each(function(){
            if ($(this).data('key') == exchange && !$(this).hasClass('hide')) {
                for (var level=0; level<tmp.length; level++) {
                    if (!average2[level]) average2[level] = {avg: parseInt(currentPrice), buy: 0, sell: 0};
                    if (tmp[level].price > 0 && tmp[level].count > 0)
                        average2[level].avg = (average2[level].avg + tmp[level].price/tmp[level].count) / 2.0;
                    average2[level].buy += tmp[level].buy;
                    average2[level].sell += tmp[level].sell;
                }
            }
        });
    }
    average2.forEach(function(data, index){
        $('#belowGrid .statistic').children('td').eq(index*3+1).text(data.avg.toFixed(2));
        $('#belowGrid .statistic').children('td').eq(index*3+2).text(parseInt(data.buy)+' '+currency);
        $('#belowGrid .statistic').children('td').eq(index*3+3).text(parseInt(data.sell)+' '+currency);
    })
}

function trade_statistic() {
    console.log('tstatistic', dataTrade);
    var currency = $('#sel-currency').val().substring(0, 3).toUpperCase();
    var tBuy = 0; 
    var tSell = 0;
    for (exchange in dataTrade) {
        var tmp = dataTrade[exchange];
        $('#exchange tr').each(function(){
            if ($(this).data('key') == exchange && !$(this).hasClass('hide')) {
                tBuy += tmp.buy;
                tSell += tmp.sell;
            }
        });
    }

    $('#tBuy').text('Total: '+parseInt(tBuy)+' '+currency);
    $('#tSell').text('Total: '+parseInt(tSell)+' '+currency);
}

$('#level').change(function(){
    currentLevel = $(this).val();
    localStorage.setItem('level', currentLevel);
    $('.table1 tr').each(function(){
        for (var i=0; i<$(this).children('th').length; i++) {
            if (i > currentLevel) $(this).children('th').eq(i).hide();
            else $(this).children('th').eq(i).show();
        }
        for (var i=0; i<$(this).children('td').length; i++) {
            if (i > currentLevel*3) $(this).children('td').eq(i).hide();
            else $(this).children('td').eq(i).show();
        }
    });
});

$('#sel-exchange').on('mousedown', function(e){
    $('#sel1').toggle();
    e.preventDefault();
});

$('#order-exchange').on('mousedown', function(e){
    $('#sel2').toggle();
    e.preventDefault();
});

$('#sel-currency').change(function(){
    dataTrade = {};
    $('#exchange tr').each(function(){
        if ($(this).data('key')) {
            $(this).children('td').eq(1).text('-');
            $(this).children('td').eq(2).text('-');
        }
    });
    $('#tBuy').text('Total: -');
    $('#tSell').text('Total: -');
    socket.emit('trade', prepareTrade());
});

$('#sel-currency1').change(function(){
    socket.emit('order', prepareOrder());
});

$(".sel-panel input[type='checkbox']").change(function(){
    if (this.checked) {
        if ($(this).hasClass('all')) {
            $(this).parent().siblings('label').find('input').each(function(){
                $(this).prop('checked', true);
            })
        }
    } else {
        if ($(this).hasClass('all')) {
            $(this).parent().siblings('label').find('input').each(function(){
                $(this).prop('checked', false);
            })
        } else {
            $(this).parent().siblings('label').find('.all').prop('checked', false);
        }
    }
    var checked;
    if ($(this).parent().parent().hasClass('sel1')) {
        checked = $.map($("#sel1 input[type='checkbox']:checked"), function(c){
            return c.value
        });
        $('#exchange tr').each(function(){
            if ($(this).data('key') && !checked.includes($(this).data('key'))) $(this).addClass('hide');
            else $(this).removeClass('hide');
        });
        refreshTotalTrade();
    } else {
        checked = $.map($("#sel2 input[type='checkbox']:checked"), function(c){
            return c.value
        });
        $('#aboveGrid tr').each(function(){
            if ($(this).data('key') && !checked.includes($(this).data('key'))) $(this).addClass('hide');
            else $(this).removeClass('hide');
        });
        $('#belowGrid tr').each(function(){
            if ($(this).data('key') && !checked.includes($(this).data('key'))) $(this).addClass('hide');
            else $(this).removeClass('hide');
        })
    }
    statistic();
    trade_statistic();
});

function refreshTotalTrade() {
    console.log('refresh');
    var totalBuy = 0;
    var totalSell = 0;
    var checked = $.map($("#sel1 input[type='checkbox']:checked"), function(c){
        return c.value
    });
    $('#exchange tr').each(function(){
        console.log($(this).find('td').eq(1).data('val')+":"+$(this).find('td').eq(2).data('val'));
        if ($(this).data('key') && checked.includes($(this).data('key'))) {
            totalBuy += parseFloat($(this).find('td').eq(1).data('val'));
            totalSell += parseFloat($(this).find('td').eq(2).data('val'));
        }
    });
    $('#tBuy').text('Total: '+totalBuy+' '+$('#sel-currency').val());
    $('#tSell').text('Total: '+totalSell+' '+$('#sel-currency').val());
}

function refreshTotalOrder() {

}

var start = true;
$('#start').prop('disabled', true);

$('#start').click(function(){
    start = true;
    $(this).prop('disabled', true);
    $('#stop').prop('disabled', false);
    socket.emit('realtime', true);
    socket.emit('order', prepareOrder());
});

$('#stop').click(function(){
    start = false;
    $(this).prop('disabled', true);
    $('#start').prop('disabled', false);
    socket.emit('realtime', false);
})