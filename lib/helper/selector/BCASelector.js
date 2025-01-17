class BCASelectors {
    static get LOGIN_PAGE() {
        return {
            url: "https://ibank.klikbca.com/",
            userField: "#user_id",
            passField: "#pswd",
            submitButton: "input[value='LOGIN']",
        };
    }

    /**
     * SELECTOR FOR SETTLEMENT PAGE
     * @date 2023-04-17
     * @returns {any}
     */
    static get SETTLEMENT_PAGE() {
        return {
            url: "https://ibank.klikbca.com/nav_bar_indo/account_information_menu.htm",
            settlementLink: "tr:nth-child(2) a",
            startDateField: "#startDt",
            startMonthField: "#startMt",
            startYearField: "#startYr",
            endDateField: "#endDt",
            endMonthField: "#endMt",
            endYearField: "#endYr",
            submitButton: "table:nth-child(4) > tbody > tr > td > input:nth-child(1)",
            settlementTable: 'table[bordercolor="#ffffff"] tr',
        };
    }

    static get LOGOUT_PAGE() {
        return {
            url: "https://ibank.klikbca.com/authentication.do?value(actions)=logout",
        };
    }
}
  
module.exports = BCASelectors;
  