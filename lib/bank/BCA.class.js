const ScraperBank = require("../BrowserClasses");
const { UA } = require("../helper/UA");
const { load } = require("cheerio");
const BCASelectors = require("../helper/selector/BCASelector");
const NameExtractor = require("../helper/getName");

class ScrapBCA extends ScraperBank {
    constructor(user, pass, path, args) {
        super(user, pass, path, args)
    }

    /**
     * Login to BCA
     * @date 2023-04-17
     * @returns {any}
     */
    async login() {
        try {
            const page = await this.launchBrowser();
            await page.setUserAgent(UA());

            await page.goto(BCASelectors.LOGIN_PAGE.url, { waitUntil: "networkidle2" });
            // await page.reload( { waitUntil: "networkidle2"});
            await page.type(BCASelectors.LOGIN_PAGE.userField, this.user , {delay :10});
            await page.type(BCASelectors.LOGIN_PAGE.passField, this.pass , {delay :10});
            await page.waitForSelector(BCASelectors.LOGIN_PAGE.submitButton);
            await page.click(BCASelectors.LOGIN_PAGE.submitButton , {delay :50});
            await this.sleep(200);

            page.on("dialog", async dialog => {
                await dialog.accept();
            });

            return page;
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    /**
    *  Get Settlement from selected date
    * @date 2023-04-17
    * @param {any} start_date ( Harus berbentuk string )
    * @param {any} start_month ( Harus berbentuk string )
    * @param {any} start_year ( Harus berbentuk string )
    * @param {any} end_date ( Harus berbentuk string )
    * @param {any} end_month ( Harus berbentuk string )
    * @param {any} end_year ( Harus berbentuk string )
    * @returns {any}
    */
    async getSettlement(start_date, start_month, start_year, end_date, end_month, end_year) {
        const page = await this.login();
        if (!page) {
            console.error("Login Failed");
            return ["err", "login failed"];
        }

        try {
            await page.goto(BCASelectors.SETTLEMENT_PAGE.url, { waitUntil: "networkidle2" });

            await page.waitForSelector(BCASelectors.SETTLEMENT_PAGE.settlementLink);
            await page.click(BCASelectors.SETTLEMENT_PAGE.settlementLink);

            const pageTarget = page.target();
            const newTarget = await page.browser().waitForTarget(target => target.opener() === pageTarget);
            const newPage = await newTarget.page();
            await newPage.setUserAgent(UA());
            await newPage.waitForSelector("#startDt", { waitUntil: "networkidle2" });

            const padStart2 = num => num.toString().padStart(2, "0");
            await newPage.select(BCASelectors.SETTLEMENT_PAGE.startDateField, padStart2(start_date));
            await newPage.select(BCASelectors.SETTLEMENT_PAGE.startMonthField, start_month.toString());
            await newPage.select(BCASelectors.SETTLEMENT_PAGE.startYearField, start_year.toString());
            await newPage.select(BCASelectors.SETTLEMENT_PAGE.endDateField, padStart2(end_date));
            await newPage.select(BCASelectors.SETTLEMENT_PAGE.endMonthField, end_month.toString());
            await newPage.select(BCASelectors.SETTLEMENT_PAGE.endYearField, end_year.toString());
            await newPage.waitForSelector(BCASelectors.SETTLEMENT_PAGE.submitButton);
            await newPage.click(BCASelectors.SETTLEMENT_PAGE.submitButton, {delay: 200});
            await newPage.waitForNavigation();
            await newPage.waitForSelector(BCASelectors.SETTLEMENT_PAGE.settlementTable, { waitUntil: "networkidle2" });
            await page.waitForTimeout(500);

            const result = await newPage.evaluate(() => document.body.innerHTML);
            const settlements = this.parseSettlement(result);
            const exists = await this.checkIfReturnToLogin(newPage, BCASelectors.LOGIN_PAGE.userField);
            if (exists) {
                console.error("Loopback Detected!");
                return ["err", "loopback detected"];
            }
            await this.logoutAndClose(page);
            return settlements;
        } catch (error) {
            console.error(error);
            await this.logoutAndClose(page);
            return ["err", error];
        }
    }

    /**
    * Function to log out and close browser
    * @date 2023-04-17
    * @param {any} page
    * @returns {any}
    */
    async logoutAndClose(page) {
        await page.goto(BCASelectors.LOGOUT_PAGE.url, { waitUntil: "networkidle2" });
        await this.closeBrowser(page);
    }

    /**
    * Funtion to parse settlement
    * @date 2023-04-17
    * @param {any} html
    * @returns {any}
    */
    parseSettlement(html) {
        const $ = load(html);
        const settlements = [];

        $(BCASelectors.SETTLEMENT_PAGE.settlementTable).each((i, row) => {
            if (i === 0) return; // skip table header row
            const settlement = {
                date: $(row).find("td").eq(0).text().trim(),
                information: $(row).find("td").eq(1).text().trim(),
                name: NameExtractor.extractBCAMutationName($(row).find("td").eq(1).text().trim()),
                branch: $(row).find("td").eq(2).text().trim(),
                amount: $(row).find("td").eq(3).text().trim(),
                type: $(row).find("td").eq(4).text().trim(),
                balance: $(row).find("td").eq(5).text().trim(),
            };
            settlements.push(settlement);
        });
        return settlements.filter(settlement => settlement.type !== "");
    }

    async checkIfReturnToLogin(page, selector) {
        try {
            const element = await page.$(selector);
            return element ?? null;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

module.exports = ScrapBCA;
