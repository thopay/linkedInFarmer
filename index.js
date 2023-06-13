const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require('fs');
const prompt = require('prompt-sync')();

puppeteer.use(StealthPlugin());

const connectionsLimit = 5;

const cookies = JSON.parse(fs.readFileSync('./cookies.json'));
cookies.forEach((cookie) => {
	delete cookie.expirationDate;
	delete cookie.hostOnly;
	delete cookie.session;
	delete cookie.storeId;
	delete cookie.sameSite;
});

const log = (message) => {
	console.log(`[${new Date().toLocaleString()}] ${message}`);
};

puppeteer.launch({
	headless: false,
}).then(async (browser) => {
    const page = await browser.newPage();
	await page.goto("https://google.com/");
	log("Google opened");
	await page.setCookie(...cookies);
	log("Cookies set");
	await page.goto("https://linkedin.com/");
	log("LinkedIn opened");
	await page.waitForSelector("#global-nav > div > nav > ul > li:nth-child(2)");
	await page.waitForTimeout(2000);
	await page.click("#global-nav > div > nav > ul > li:nth-child(2)");
	log("Clicked on My Network");
	await page.waitForSelector(`ul[class="artdeco-card mb4 overflow-hidden"]`);
	log("Connection cards loaded")
	const items = await page.evaluate(() => {
		return [...document.querySelectorAll('h2[class="display-flex flex-1 t-16"]')].filter(e => e.innerText.includes('People')).map(e => {
			return e.innerText
		})
	})
	items.forEach((item, index) => {
		console.log(`${index + 1}. ${item}`);
	});
	const userInput = prompt('Enter the number of the group you want to connect with: ');
	const selection = items[parseInt(userInput) - 1];
	await page.evaluate((selection) => {
		[...document.querySelectorAll('h2[class="display-flex flex-1 t-16"]')].filter(e => e.innerText.includes('People')).filter(e => e.innerText === selection).map(e => {
			const button = [...e.parentNode.childNodes].filter(e => e?.innerText && e?.innerText.includes('See all'))[0];
			button.click();
			return;
		})
	}, selection);
	log("Clicked on See All");
	await page.waitForSelector('section[class="relative pb2"]');
	await page.waitForTimeout(2000);
	await page.evaluate(() => {
		((selector) => {
			return new Promise(resolve => {
				if (document.querySelector('section[class="relative pb2"]').querySelector(selector)) {
					return resolve(document.querySelector('section[class="relative pb2"]').querySelector(selector));
				}
		
				const observer = new MutationObserver(mutations => {
					if (document.querySelector('section[class="relative pb2"]').querySelector(selector)) {
						resolve(document.querySelector('section[class="relative pb2"]').querySelector(selector));
						observer.disconnect();
					}
				});
		
				observer.observe(document.body, {
					childList: true,
					subtree: true
				});
			});
		})('div[class="discover-entity-type-card__bottom-container"]').then(_ => {return});
	});
	log("Connection cards loaded");
	await page.evaluate(async (connectionsLimit) => {
		let connectionCount = 0;
		const buttons = [...document.querySelector('section[class="relative pb2"]').querySelectorAll('button[class="artdeco-button artdeco-button--2 artdeco-button--secondary ember-view full-width"]')].filter(e => e.innerText.includes('Connect'));
		for (let i = 0; i < buttons.length; i++) {
			if (connectionCount >= connectionsLimit) return;
			const sleep = Math.floor(Math.random() * 10000) + 1000;
			buttons[i].innerText = `Clicking in ${sleep}ms`;
			await new Promise(r => setTimeout(r, sleep));
			buttons[i].innerText = `Clicking!`;
			//buttons[i].click();
			buttons[i].innerText = `Clicked!`;
			connectionCount++;
		}
	}, connectionsLimit);
});
