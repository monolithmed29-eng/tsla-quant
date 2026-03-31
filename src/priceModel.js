const BEAR = 120;
const BULL = 450;

export function calcPredictedPrice(catalysts) {
  const score = catalysts.reduce((sum, c) => sum + c.weight * c.likelihood, 0);
  return BEAR + (BULL - BEAR) * score;
}

export function calcPriceImpact(catalyst) {
  return (BULL - BEAR) * catalyst.weight * catalyst.likelihood;
}
