type DecimalValue = number | string;

type DecimalParts = {
  coefficient: bigint;
  scale: number;
};

function parseDecimal(value: DecimalValue): DecimalParts | null {
  const source = String(value).trim().toLowerCase();
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/.exec(source);

  if (!match) {
    return null;
  }

  const sign = match[1] === "-" ? -1n : 1n;
  const fraction = match[3] ?? "";
  const exponent = Number(match[4] ?? 0);
  let coefficient = sign * BigInt(`${match[2]}${fraction}`);
  let scale = fraction.length - exponent;

  if (scale < 0) {
    coefficient *= 10n ** BigInt(-scale);
    scale = 0;
  }

  return { coefficient, scale };
}

function scaledCoefficient(parts: DecimalParts, scale: number): bigint {
  return parts.coefficient * 10n ** BigInt(scale - parts.scale);
}

export function isDecimalStepAligned(
  value: DecimalValue,
  origin: DecimalValue,
  step: DecimalValue | null | undefined,
): boolean {
  if (step == null || Number(step) <= 0) {
    return true;
  }

  const parsedValue = parseDecimal(value);
  const parsedOrigin = parseDecimal(origin);
  const parsedStep = parseDecimal(step);

  if (!parsedValue || !parsedOrigin || !parsedStep) {
    return false;
  }

  const scale = Math.max(
    parsedValue.scale,
    parsedOrigin.scale,
    parsedStep.scale,
  );
  const difference =
    scaledCoefficient(parsedValue, scale) -
    scaledCoefficient(parsedOrigin, scale);
  const divisor = scaledCoefficient(parsedStep, scale);

  return divisor !== 0n && difference % divisor === 0n;
}
