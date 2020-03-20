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

function prepareTrade() {
    var tradeCurrency = $('#sel-currency').val();
    var tradeExchanges = $.map($("#sel1 input[type='checkbox']:checked"), function(c){
        if (!c.value) return null;
        return c.value
    });
    return {currency: tradeCurrency, exchanges: tradeExchanges}
}

function prepareOrder() {
    var orderCurrency = $('#sel-currency1').val();
    var orderExchanges = $.map($("#sel2 input[type='checkbox']:checked"), function(c){
        if (!c.value) return null;
        return c.value
    });
    var level = parseInt($('#level').val());
    if (level > 5) level = 5;
    return {currency: orderCurrency, exchanges: orderExchanges, level: level}
}
    
$("body").loading('start');
socket.emit('trade', prepareTrade());
socket.emit('order', prepareOrder());

socket.on('connect', function(){
    console.log('connected');
});

socket.on('order', function(orders) {
    console.log(orders);
    $("body").loading('stop');
});

socket.on('trade', function(trades) {
    console.log(trades);
    var exchange;
    var tradeCurrency = $('#sel-currency').val();

    $('#exchange tbody tr').each(function(){
        $(this).find('td').eq(1).text('-').data('val', 0);
        $(this).find('td').eq(2).text('-').data('val', 0);
    })

    for (exchange in trades) {
        $('#exchange tbody tr').each(function(){
            if ($(this).data('key') === exchange) {
                $(this).find('td').eq(1).text(trades[exchange].buy+' '+tradeCurrency).data('val', trades[exchange].buy);
                $(this).find('td').eq(2).text(trades[exchange].sell+' '+tradeCurrency).data('val', trades[exchange].sell);
            }
        })
    }

    refreshTotalTrade();
    
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
            if ($(this).data('key') && !checked.includes($(this).data('key'))) $(this).hide();
            else $(this).show();
        });
        refreshTotalTrade();
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

var start = false;
$('#stop').prop('disabled', true);

$('#start').click(function(){
    start = true;
    $(this).prop('disabled', true);
    $('#stop').prop('disabled', false);
});

$('#stop').click(function(){
    start = false;
    $(this).prop('disabled', true);
    $('#start').prop('disabled', false);
})