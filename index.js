#!/usr/bin/env node

/*
 ============================================================================
 Name        : GDAX Trading Bot
 Author      : Kenshiro, Lorrx
 Version     : 7.03
 Copyright   : GNU General Public License (GPLv3)
 Description : Trading bot for the Coinbase Pro exchange
 ============================================================================
 */

const APP_VERSION = "v7.03";

const GdaxModule = require('coinbase-pro');

const PASSPHRASE = process.env.TRADING_BOT_PASSPHRASE || '';
const KEY = process.env.TRADING_BOT_KEY || '';
const SECRET = process.env.TRADING_BOT_SECRET || '';

const GDAX_URI = 'https://api.pro.coinbase.com';

const LTC_BTC_CURRENCY_PAIR = 'LTC-BTC';
const ETH_BTC_CURRENCY_PAIR = 'ETH-BTC';
const XLM_BTC_CURRENCY_PAIR = 'XLM-BTC';
const EOS_BTC_CURRENCY_PAIR = 'EOS-BTC';
const ZRX_BTC_CURRENCY_PAIR = 'ZRX-BTC';

const BITCOIN_TICKER = 'BTC';
const LITECOIN_TICKER = 'LTC';
const ETHEREUM_TICKER = 'ETH';
const STELLAR_TICKER = 'XLM';
const EOS_TICKER = 'EOS';
const ZRX_TICKER = 'ZRX';

const SLEEP_TIME = 30000;

// The seed is the amount of coins that the program will trade continuously
const SEED_LTC_AMOUNT = 1.0;
const SEED_ETH_AMOUNT = 1.0;
const SEED_XLM_AMOUNT = 122.0;
const SEED_EOS_AMOUNT = 1.0;
const SEED_ZRX_AMOUNT = 1.0;

// Profit percentage trading a seed
const PROFIT_PERCENTAGE = 2.0;

const MINIMUM_BUY_PRICE_MULTIPLIER = 100.5 / 100.0;

const SELL_PRICE_MULTIPLIER = (100.0 + PROFIT_PERCENTAGE) / 100.0;

let askPriceLTC = null;
let averagePriceLTC = null;
let lastBuyOrderIdLTC = null;
let lastBuyOrderPriceLTC = null;

let askPriceXLM = null;
let averagePriceXLM = null;
let lastBuyOrderIdXLM = null;
let lastBuyOrderPriceXLM = null;

let askPriceEOS = null;
let averagePriceEOS = null;
let lastBuyOrderIdEOS = null;
let lastBuyOrderPriceEOS = null;

let askPriceETH = null;
let averagePriceETH = null;
let lastBuyOrderIdETH = null;
let lastBuyOrderPriceETH = null;

let askPriceZRX = null;
let averagePriceZRX = null;
let lastBuyOrderIdZRX = null;
let lastBuyOrderPriceZRX = null;

let btcAvailable = 0;
let btcBalance = 0;

let ltcAvailable = 0;
let ltcBalance = 0;

let ethAvailable = 0;
let ethBalance = 0;

let xlmAvailable = 0;
let xlmBalance = 0;

let eosAvailable = 0;
let eosBalance = 0;

let zrxAvailable = 0;
let zrxBalance = 0;

let numberOfCyclesCompleted = 0;

let estimatedProfit = 0;

let authenticatedClient = null;
let publicClient = null;

// Callbacks

const buyOrderCallbackLTC = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending'))
		lastBuyOrderIdLTC = data.id;
	return console.log(data);
};

const buyOrderCallbackETH = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending'))
		lastBuyOrderIdETH = data.id;
	return console.log(data);
};

const buyOrderCallbackXLM = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending'))
		lastBuyOrderIdXLM = data.id;
	return console.log(data);
};

const buyOrderCallbackEOS = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending'))
		lastBuyOrderIdEOS = data.id;
	return console.log(data);
};

const buyOrderCallbackZRX = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending'))
		lastBuyOrderIdZRX = data.id;
	return console.log(data);
};


const sellOrderCallbackLTC = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending')) {
		estimatedProfit = estimatedProfit + SEED_LTC_AMOUNT * (parseFloat(data.price) - lastBuyOrderPriceLTC);
		averagePriceLTC = lastBuyOrderPriceLTC;
		lastBuyOrderPriceLTC = null;
		lastBuyOrderIdLTC = null;
		numberOfCyclesCompleted++;
	}
	return console.log(data);
};

const sellOrderCallbackETH = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending')) {
		estimatedProfit = estimatedProfit + SEED_ETH_AMOUNT * (parseFloat(data.price) - lastBuyOrderPriceETH);
		averagePriceETH = lastBuyOrderPriceETH;
		lastBuyOrderPriceETH = null;
		lastBuyOrderIdETH = null;
		numberOfCyclesCompleted++;
	}
	return console.log(data);
};

const sellOrderCallbackXLM = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending')) {
		estimatedProfit = estimatedProfit + SEED_XLM_AMOUNT * (parseFloat(data.price) - lastBuyOrderPriceXLM);
		averagePriceXLM = lastBuyOrderPriceXLM;
		lastBuyOrderPriceXLM = null;
		lastBuyOrderIdXLM = null;
		numberOfCyclesCompleted++;
	}
	return console.log(data);
};

const sellOrderCallbackEOS = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending')) {
		estimatedProfit = estimatedProfit + SEED_EOS_AMOUNT * (parseFloat(data.price) - lastBuyOrderPriceEOS);
		averagePriceEOS = lastBuyOrderPriceEOS;
		lastBuyOrderPriceEOS = null;
		lastBuyOrderIdEOS = null;
		numberOfCyclesCompleted++;
	}
	return console.log(data);
};

const sellOrderCallbackZRX = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.status === 'pending')) {
		estimatedProfit = estimatedProfit + SEED_ZRX_AMOUNT * (parseFloat(data.price) - lastBuyOrderPriceZRX);
		averagePriceZRX = lastBuyOrderPriceZRX;
		lastBuyOrderPriceZRX = null;
		lastBuyOrderIdZRX = null;
		numberOfCyclesCompleted++;
	}
	return console.log(data);
};

const getProductTickerCallbackLTC = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.ask != null) && (data.time != null)) {
		askPriceLTC = parseFloat(data.ask);
		if (averagePriceLTC === null)
			console.log("[LITECOIN TICKER] Now: " + askPriceLTC.toFixed(6) + " BTC, time: " + data.time);
		else
			console.log("[LITECOIN TICKER] Now: " + askPriceLTC.toFixed(6) + " BTC, average: " + averagePriceLTC.toFixed(6) + " BTC, time: " + data.time);
		const buyPrice = askPriceLTC * SEED_LTC_AMOUNT;
		if ((btcAvailable >= buyPrice) && (averagePriceLTC != null) && (lastBuyOrderIdLTC === null))
			placeBuyOrderLTC();
		else if ((ltcAvailable >= SEED_LTC_AMOUNT) && (lastBuyOrderIdLTC != null))
			placeSellOrderLTC();
		if (averagePriceLTC === null)
			averagePriceLTC = askPriceLTC;
		else
			averagePriceLTC = (averagePriceLTC * 1000 + askPriceLTC) / 1001;
		setTimeout(() => publicClient.getProductTicker(ETH_BTC_CURRENCY_PAIR, getProductTickerCallbackETH), 10000);
	}
};

const getProductTickerCallbackETH = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.ask != null) && (data.time != null)) {
		askPriceETH = parseFloat(data.ask);
		if (averagePriceETH == null)
			console.log("[ETHEREUM TICKER] Now: " + askPriceETH.toFixed(6) + " BTC, time: " + data.time);
		else
			console.log("[ETHEREUM TICKER] Now: " + askPriceETH.toFixed(6) + " BTC, average: " + averagePriceETH.toFixed(6) + " BTC, time: " + data.time);
		const buyPrice = askPriceETH * SEED_ETH_AMOUNT;
		if ((btcAvailable >= buyPrice) && (averagePriceETH != null) && (lastBuyOrderIdETH === null))
			placeBuyOrderETH();
		else if ((ethAvailable >= SEED_ETH_AMOUNT) && (lastBuyOrderIdETH != null))
			placeSellOrderETH();
		if (averagePriceETH === null)
			averagePriceETH = askPriceETH;
		else
			averagePriceETH = (averagePriceETH * 1000 + askPriceETH) / 1001;
	}
};

const getProductTickerCallbackXLM = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.ask != null) && (data.time != null)) {
		askPriceXLM = parseFloat(data.ask);
		if (averagePriceXLM == null)
			console.log("[STELLAR TICKER] Now: " + askPriceXLM.toFixed(6) + " BTC, time: " + data.time);
		else
			console.log("[STELLAR TICKER] Now: " + askPriceXLM.toFixed(6) + " BTC, average: " + averagePriceXLM.toFixed(6) + " BTC, time: " + data.time);
		const buyPrice = askPriceXLM * SEED_XLM_AMOUNT;
		if ((btcAvailable >= buyPrice) && (averagePriceXLM != null) && (lastBuyOrderIdXLM === null))
			placeBuyOrderXLM();
		else if ((xlmAvailable >= SEED_XLM_AMOUNT) && (lastBuyOrderIdXLM != null))
			placeSellOrderXLM();
		if (averagePriceXLM === null)
			averagePriceXLM = askPriceXLM;
		else
			averagePriceXLM = (averagePriceXLM * 1000 + askPriceXLM) / 1001;
	}
};

const getProductTickerCallbackEOS = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.ask != null) && (data.time != null)) {
		askPriceEOS = parseFloat(data.ask);
		if (averagePriceEOS == null)
			console.log("[EOS TICKER] Now: " + askPriceEOS.toFixed(6) + " BTC, time: " + data.time);
		else
			console.log("[EOS TICKER] Now: " + askPriceEOS.toFixed(6) + " BTC, average: " + averagePriceEOS.toFixed(6) + " BTC, time: " + data.time);
		const buyPrice = askPriceEOS * SEED_EOS_AMOUNT;
		if ((btcAvailable >= buyPrice) && (averagePriceEOS != null) && (lastBuyOrderIdEOS === null))
			placeBuyOrderEOS();
		else if ((eosAvailable >= SEED_EOS_AMOUNT) && (lastBuyOrderIdEOS != null))
			placeSellOrderEOS();
		if (averagePriceEOS === null)
			averagePriceEOS = askPriceEOS;
		else
			averagePriceEOS = (averagePriceEOS * 1000 + askPriceEOS) / 1001;
	}
};

const getProductTickerCallbackZRX = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((data != null) && (data.ask != null) && (data.time != null)) {
		askPriceZRX = parseFloat(data.ask);
		if (averagePriceZRX == null)
			console.log("[ZRX TICKER] Now: " + askPriceZRX.toFixed(6) + " BTC, time: " + data.time);
		else
			console.log("[ZRX TICKER] Now: " + askPriceZRX.toFixed(6) + " BTC, average: " + averagePriceZRX.toFixed(6) + " BTC, time: " + data.time);
		const buyPrice = askPriceZRX * SEED_ZRX_AMOUNT;
		if ((btcAvailable >= buyPrice) && (averagePriceZRX != null) && (lastBuyOrderIdZRX === null))
			placeBuyOrderZRX();
		else if ((zrxAvailable >= SEED_ZRX_AMOUNT) && (lastBuyOrderIdZRX != null))
			placeSellOrderZRX();
		if (averagePriceZRX === null)
			averagePriceZRX = askPriceZRX;
		else
			averagePriceZRX = (averagePriceZRX * 1000 + askPriceZRX) / 1001;
	}
};

const getAccountsCallback = (error, response, data) => {
	if (error)
		return console.log(error);

	if ((data != null) && (Symbol.iterator in Object(data))) {
		for (const item of data) {
			if (item.currency === BITCOIN_TICKER) {
				btcAvailable = parseFloat(item.available);
				btcBalance = parseFloat(item.balance);
			} else if (item.currency === LITECOIN_TICKER) {
				ltcAvailable = parseFloat(item.available);
				ltcBalance = parseFloat(item.balance);
			} else if (item.currency === ETHEREUM_TICKER) {
				ethAvailable = parseFloat(item.available);
				ethBalance = parseFloat(item.balance);
			} else if (item.currency === STELLAR_TICKER) {
				xlmAvailable = parseFloat(item.available);
				xlmBalance = parseFloat(item.balance);
			} else if (item.currency === EOS_TICKER) {
				eosAvailable = parseFloat(item.available);
				eosBalance = parseFloat(item.balance);
			} else if (item.currency === ZRX_TICKER) {
				zrxAvailable = parseFloat(item.available);
				zrxBalance = parseFloat(item.balance);
			}
		}

		console.log("[BITCOIN  WALLET] Available: " + btcAvailable.toFixed(8) + " BTC, Balance: " + btcBalance.toFixed(8) + " BTC");
		console.log("[LITECOIN WALLET] Available: " + ltcAvailable.toFixed(8) + " LTC, Balance: " + ltcBalance.toFixed(8) + " LTC");
		console.log("[ETHEREUM WALLET] Available: " + ethAvailable.toFixed(8) + " ETH, Balance: " + ethBalance.toFixed(8) + " ETH");
		console.log("[STELLAR WALLET] Available: " + xlmAvailable.toFixed(8) + " XLM, Balance: " + xlmBalance.toFixed(8) + " XLM");
		console.log("[EOS WALLET] Available: " + eosAvailable.toFixed(8) + " EOS, Balance: " + eosBalance.toFixed(8) + " EOS");
		console.log("[ZRX WALLET] Available: " + zrxAvailable.toFixed(8) + " ZRX, Balance: " + zrxBalance.toFixed(8) + " ZRX\n");

		console.log("[INFO] Number of cycles completed: " + numberOfCyclesCompleted + ", estimated profit: " + estimatedProfit.toFixed(8) + " BTC\n");

		publicClient.getProductTicker(LTC_BTC_CURRENCY_PAIR, getProductTickerCallbackLTC);
		publicClient.getProductTicker(XLM_BTC_CURRENCY_PAIR, getProductTickerCallbackXLM);
		publicClient.getProductTicker(EOS_BTC_CURRENCY_PAIR, getProductTickerCallbackEOS);
		publicClient.getProductTicker(ZRX_BTC_CURRENCY_PAIR, getProductTickerCallbackZRX);
	}
};

const getFilledPriceCallbackLTC = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((Array.isArray(data)) && (data.length >= 1)) {
		lastBuyOrderPriceLTC = parseFloat(data[0].price);
		let highestPrice;
		if (askPriceLTC > lastBuyOrderPriceLTC)
			highestPrice = askPriceLTC;
		else
			highestPrice = lastBuyOrderPriceLTC;
		const sellPrice = highestPrice * SELL_PRICE_MULTIPLIER;
		const sellSize = ltcAvailable - 0.000000001;
		const sellParams =
			{
				'price': sellPrice.toFixed(6),
				'size': sellSize.toFixed(8),
				'product_id': LTC_BTC_CURRENCY_PAIR,
				'post_only': true,
			};
		console.log("");
		console.log("\x1b[41m%s\x1b[0m", "[SELL ORDER] Price: " + sellPrice.toFixed(6) + " BTC, size: " + sellSize.toFixed(2) + " LTC");
		setTimeout(() => authenticatedClient.sell(sellParams, sellOrderCallbackLTC), 3000);
	}

	return console.log(data);
};

const getFilledPriceCallbackETH = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((Array.isArray(data)) && (data.length >= 1)) {
		lastBuyOrderPriceETH = parseFloat(data[0].price);
		let highestPrice;

		if (askPriceETH > lastBuyOrderPriceETH)
			highestPrice = askPriceETH;
		else
			highestPrice = lastBuyOrderPriceETH;
		const sellPrice = highestPrice * SELL_PRICE_MULTIPLIER;
		const sellSize = ethAvailable - 0.000000001;
		const sellParams =
			{
				'price': sellPrice.toFixed(5),
				'size': sellSize.toFixed(8),
				'product_id': ETH_BTC_CURRENCY_PAIR,
				'post_only': true,
			};
		console.log("");
		console.log("\x1b[41m%s\x1b[0m", "[SELL ORDER] Price: " + sellPrice.toFixed(6) + " BTC, size: " + sellSize.toFixed(2) + " ETH");
		setTimeout(() => authenticatedClient.sell(sellParams, sellOrderCallbackETH), 3000);
	}
	return console.log(data);
};

const getFilledPriceCallbackXLM = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((Array.isArray(data)) && (data.length >= 1)) {
		lastBuyOrderPriceXLM = parseFloat(data[0].price);
		let highestPrice;

		if (askPriceXLM > lastBuyOrderPriceXLM)
			highestPrice = askPriceXLM;
		else
			highestPrice = lastBuyOrderPriceXLM;
		const sellPrice = highestPrice * SELL_PRICE_MULTIPLIER;
		const sellSize = xlmAvailable - 0.000000001;
		const sellParams =
			{
				'price': sellPrice.toFixed(5),
				'size': sellSize.toFixed(8),
				'product_id': XLM_BTC_CURRENCY_PAIR,
				'post_only': true,
			};
		console.log("");
		console.log("\x1b[41m%s\x1b[0m", "[SELL ORDER] Price: " + sellPrice.toFixed(6) + " BTC, size: " + sellSize.toFixed(2) + " XLM");
		setTimeout(() => authenticatedClient.sell(sellParams, sellOrderCallbackXLM), 3000);
	}
	return console.log(data);
};

const getFilledPriceCallbackEOS = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((Array.isArray(data)) && (data.length >= 1)) {
		lastBuyOrderPriceEOS = parseFloat(data[0].price);
		let highestPrice;

		if (askPriceEOS > lastBuyOrderPriceEOS)
			highestPrice = askPriceEOS;
		else
			highestPrice = lastBuyOrderPriceEOS;
		const sellPrice = highestPrice * SELL_PRICE_MULTIPLIER;
		const sellSize = eosAvailable - 0.000000001;
		const sellParams =
			{
				'price': sellPrice.toFixed(5),
				'size': sellSize.toFixed(8),
				'product_id': EOS_BTC_CURRENCY_PAIR,
				'post_only': true,
			};
		console.log("");
		console.log("\x1b[41m%s\x1b[0m", "[SELL ORDER] Price: " + sellPrice.toFixed(6) + " BTC, size: " + sellSize.toFixed(2) + " EOS");
		setTimeout(() => authenticatedClient.sell(sellParams, sellOrderCallbackEOS), 3000);
	}
	return console.log(data);
};

const getFilledPriceCallbackZRX = (error, response, data) => {
	if (error)
		return console.log(error);
	if ((Array.isArray(data)) && (data.length >= 1)) {
		lastBuyOrderPriceZRX = parseFloat(data[0].price);
		let highestPrice;

		if (askPriceZRX > lastBuyOrderPriceZRX)
			highestPrice = askPriceZRX;
		else
			highestPrice = lastBuyOrderPriceZRX;
		const sellPrice = highestPrice * SELL_PRICE_MULTIPLIER;
		const sellSize = zrxAvailable - 0.000000001;
		const sellParams =
			{
				'price': sellPrice.toFixed(5),
				'size': sellSize.toFixed(8),
				'product_id': ZRX_BTC_CURRENCY_PAIR,
				'post_only': true,
			};
		console.log("");
		console.log("\x1b[41m%s\x1b[0m", "[SELL ORDER] Price: " + sellPrice.toFixed(6) + " BTC, size: " + sellSize.toFixed(2) + " ZRX");
		setTimeout(() => authenticatedClient.sell(sellParams, sellOrderCallbackZRX), 3000);
	}
	return console.log(data);
};

// Functions

function placeBuyOrderLTC() {
	const minimumBuyPrice = averagePriceLTC * MINIMUM_BUY_PRICE_MULTIPLIER;
	if (askPriceLTC >= minimumBuyPrice) {
		const buySize = SEED_LTC_AMOUNT;
		const buyParams =
			{
				'size': buySize.toFixed(8),
				'product_id': LTC_BTC_CURRENCY_PAIR,
				'type': 'market'
			};
		console.log("");
		console.log("\x1b[42m%s\x1b[0m", "[BUY ORDER] Size: " + buySize.toFixed(2) + " LTC");
		authenticatedClient.buy(buyParams, buyOrderCallbackLTC);
	}
}

function placeBuyOrderETH() {
	const minimumBuyPrice = averagePriceETH * MINIMUM_BUY_PRICE_MULTIPLIER;
	if (askPriceETH >= minimumBuyPrice) {
		const buySize = SEED_ETH_AMOUNT;
		const buyParams =
			{
				'size': buySize.toFixed(8),
				'product_id': ETH_BTC_CURRENCY_PAIR,
				'type': 'market'
			};
		console.log("");
		console.log("\x1b[42m%s\x1b[0m", "[BUY ORDER] Size: " + buySize.toFixed(2) + " ETH");
		authenticatedClient.buy(buyParams, buyOrderCallbackETH);
	}
}

function placeBuyOrderXLM() {
	const minimumBuyPrice = averagePriceXLM * MINIMUM_BUY_PRICE_MULTIPLIER;
	if (askPriceXLM >= minimumBuyPrice) {
		const buySize = SEED_XLM_AMOUNT;
		const buyParams =
			{
				'size': buySize.toFixed(8),
				'product_id': XLM_BTC_CURRENCY_PAIR,
				'type': 'market'
			};
		console.log("");
		console.log("\x1b[42m%s\x1b[0m", "[BUY ORDER] Size: " + buySize.toFixed(2) + " XLM");
		authenticatedClient.buy(buyParams, buyOrderCallbackXLM);
	}
}

function placeBuyOrderEOS() {
	const minimumBuyPrice = averagePriceEOS * MINIMUM_BUY_PRICE_MULTIPLIER;
	if (askPriceEOS >= minimumBuyPrice) {
		const buySize = SEED_EOS_AMOUNT;
		const buyParams =
			{
				'size': buySize.toFixed(8),
				'product_id': EOS_BTC_CURRENCY_PAIR,
				'type': 'market'
			};
		console.log("");
		console.log("\x1b[42m%s\x1b[0m", "[BUY ORDER] Size: " + buySize.toFixed(2) + " EOS");
		authenticatedClient.buy(buyParams, buyOrderCallbackEOS);
	}
}

function placeBuyOrderZRX() {
	const minimumBuyPrice = averagePriceZRX * MINIMUM_BUY_PRICE_MULTIPLIER;
	if (askPriceZRX >= minimumBuyPrice) {
		const buySize = SEED_ZRX_AMOUNT;
		const buyParams =
			{
				'size': buySize.toFixed(8),
				'product_id': ZRX_BTC_CURRENCY_PAIR,
				'type': 'market'
			};
		console.log("");
		console.log("\x1b[42m%s\x1b[0m", "[BUY ORDER] Size: " + buySize.toFixed(2) + " ZRX");
		authenticatedClient.buy(buyParams, buyOrderCallbackZRX);
	}
}

function placeSellOrderLTC() {
	const params =
		{
			order_id: lastBuyOrderIdLTC
		};
	authenticatedClient.getFills(params, getFilledPriceCallbackLTC);
}

function placeSellOrderETH() {
	const params =
		{
			order_id: lastBuyOrderIdETH
		};
	authenticatedClient.getFills(params, getFilledPriceCallbackETH);
}

function placeSellOrderXLM() {
	const params =
		{
			order_id: lastBuyOrderIdXLM
		};
	authenticatedClient.getFills(params, getFilledPriceCallbackXLM);
}

function placeSellOrderEOS() {
	const params =
		{
			order_id: lastBuyOrderIdEOS
		};
	authenticatedClient.getFills(params, getFilledPriceCallbackEOS);
}

function placeSellOrderZRX() {
	const params =
		{
			order_id: lastBuyOrderIdZRX
		};
	authenticatedClient.getFills(params, getFilledPriceCallbackZRX);
}

// Main logic

console.log("\n");
console.log("          __________  ___   _  __    ______               ___");
console.log("         / ____/ __ \\/   | | |/ /   /_  __/________ _____/ (_)___  ____ _");
console.log("        / / __/ / / / /| | |   /     / / / ___/ __ `/ __  / / __ \\/ __ `/");
console.log("       / /_/ / /_/ / ___ |/   |     / / / /  / /_/ / /_/ / / / / / /_/ / ");
console.log("       \\____/_____/_/  |_/_/|_|    /_/ /_/   \\__,_/\\__,_/_/_/ /_/\\__, /");
console.log("                                                                /____/");
console.log("                                  ____        __");
console.log("                                 / __ )____  / /_");
console.log("                                / __  / __ \\/ __/");
console.log("                               / /_/ / /_/ / /_ ");
console.log("                              /_____/\\____/\\__/   " + APP_VERSION);

console.log("\n\n\n\n                    \"The Revolution Will Be Decentralized\"");

console.log("\n\n\n\nConnecting to Coinbase Pro in " + parseInt(SLEEP_TIME / 1000) + " seconds ...");

setInterval(() => {
	console.log('\n\n');

	askPriceLTC = null;
	askPriceETH = null;

	btcAvailable = 0;
	btcBalance = 0;

	ltcAvailable = 0;
	ltcBalance = 0;

	ethAvailable = 0;
	ethBalance = 0;

	xlmAvailable = 0;
	xlmBalance = 0;

	eosAvailable = 0;
	eosBalance = 0;

	zrxAvailable = 0;
	zrxBalance = 0;

	publicClient = new GdaxModule.PublicClient(GDAX_URI);
	authenticatedClient = new GdaxModule.AuthenticatedClient(KEY, SECRET, PASSPHRASE, GDAX_URI);

	// Get the balance of the wallets and execute the trading strategy
	authenticatedClient.getAccounts(getAccountsCallback);

}, SLEEP_TIME);


