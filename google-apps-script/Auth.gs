function verifyRequestSignature_(body) {
  var config = getConfig_();
  if (!config.GAS_INGESTION_HMAC_SECRET) {
    return false;
  }

  var sig = body.sig;
  if (!sig || !body.exp) {
    return false;
  }

  if (Number(body.exp) < Math.floor(Date.now() / 1000)) {
    return false;
  }

  var canonical = JSON.stringify({
    action: body.action,
    sourceId: body.sourceId,
    botId: body.botId,
    websiteUrl: body.websiteUrl,
    exp: body.exp
  });

  var expected = Utilities.computeHmacSha256Signature(canonical, config.GAS_INGESTION_HMAC_SECRET)
    .map(function (byte) {
      var hex = (byte < 0 ? byte + 256 : byte).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');

  return expected === sig;
}
