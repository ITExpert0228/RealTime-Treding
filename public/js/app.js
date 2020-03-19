var socket = io.connect('http://192.168.0.38:3000');
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

var tradeCurrency = 'BTC';
var tradeExchanges = $.map($("#sel1 input[type='checkbox']:checked"), function(c){
    if (!c.value) return null;
    return c.value
});

var orderCurrency = 'BTC';
var orderExchanges = $.map($("#sel2 input[type='checkbox']:checked"), function(c){
    if (!c.value) return null;
    return c.value
});

socket.emit('join', {
    trade: {currency: tradeCurrency, exchanges: tradeExchanges},
    order: {currency: orderCurrency, exchanges: orderExchanges},
});

socket.on('order', function(orders) {
    console.log(orders);
});

$('#sel-exchange').on('mousedown', function(e){
    $('#sel1').toggle();
    e.preventDefault();
});

$('#order-exchange').on('mousedown', function(e){
    $('#sel2').toggle();
    e.preventDefault();
});

$(".sel-panel input[type='checkbox']").change(function(){
    if (this.checked) {
        if ($(this).val() == 'all') {
            $(this).parent().siblings('label').find('input').each(function(){
                $(this).prop('checked', true);
            })
        }
    } else {
        if ($(this).val() == 'all') {
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
            if ($(this).data('key') && !checked.includes($(this).data('key'))) $(this).hide();
            else $(this).show();
        })
    } else {
        checked = $.map($("#sel2 input[type='checkbox']:checked"), function(c){
            return c.value
        });
        $('#aboveGrid tr').each(function(){
            if ($(this).data('key') && !checked.includes($(this).data('key'))) $(this).hide();
            else $(this).show();
        });
        $('#belowGrid tr').each(function(){
            if ($(this).data('key') && !checked.includes($(this).data('key'))) $(this).hide();
            else $(this).show();
        })
    }
    
    
});