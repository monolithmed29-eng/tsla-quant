const fetch = require('node-fetch');

// --- THE QUANT CORE ---
function stdNormalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
}

exports.handler = async (event) => {
    const body = JSON.parse(event.body || "{}");
    const shares = parseInt(body.shares) || 0;
    const cash = parseFloat(body.cash) || 0;
    const risk = parseInt(body.risk) || 5;

    try {
        const priceRes = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/TSLA');
        const priceData = await priceRes.json();
        const currentPrice = priceData.chart.result[0].meta.regularMarketPrice;

        let recommendations = [];

        // --- STRATEGY A: CASH SECURED PUT (CSP) ---
        // Aggressive (10) = High Strike (Near Price)
        // Conservative (1) = Low Strike (Deep Margin of Safety)
        if (cash >= (currentPrice * 0.8 * 100)) {
            const safetyMargin = 0.25 - (risk * 0.02); // Risk 1 = 23% below price, Risk 10 = 5% below
            const cspStrike = Math.floor(currentPrice * (1 - safetyMargin)); 
            const dte = 30;
            const premium = (currentPrice * 0.01) * (risk * 0.8); 
            
            recommendations.push({
                category: "Monthly Income",
                strategy: "Cash Secured Put",
                strike: cspStrike,
                exp: "30 Days Out",
                premium: premium.toFixed(2),
                total_credit: (premium * 100).toFixed(2),
                aroc_annualized: ((premium / cspStrike) * (365 / dte) * 100).toFixed(1) + "%",
                match_score: (100 - (Math.abs(risk - 5) * 2)).toFixed(1)
            });
        }

        // --- STRATEGY B: COVERED CALL (CC) ---
        // Aggressive (10) = Low Strike (Near Price)
        // Conservative (1) = High Strike (Way OTM)
        if (shares >= 100) {
            const upsideBuffer = 0.25 - (risk * 0.02); // Risk 1 = 23% above price, Risk 10 = 5% above
            const ccStrike = Math.ceil(currentPrice * (1 + upsideBuffer));
            const dte = 30;
            const premium = (currentPrice * 0.01) * (risk * 0.7);

            recommendations.push({
                category: "Monthly Income",
                strategy: "Covered Call",
                strike: ccStrike,
                exp: "30 Days Out",
                premium: premium.toFixed(2),
                total_credit: (premium * 100).toFixed(2),
                aroc_annualized: ((premium / currentPrice) * (365 / dte) * 100).toFixed(1) + "%",
                match_score: (100 - (Math.abs(risk - 5) * 1.5)).toFixed(1)
            });
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(recommendations)
        };

    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};