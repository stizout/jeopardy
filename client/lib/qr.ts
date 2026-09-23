import QRCode from "qrcode";
import { SITE_ORIGIN } from "../../shared/site.ts";

export function playUrl(code: string) {
  return `${SITE_ORIGIN}/play/${code.toUpperCase()}`;
}

export function boardUrl(code: string) {
  return `${SITE_ORIGIN}/board/${code.toUpperCase()}`;
}

export async function playQr(code: string) {
  const url = playUrl(code);
  const data = await QRCode.toDataURL(url, {
    margin: 0,
    width: 320,
    color: { dark: "#0C0A08", light: "#F6F0E4" },
  });
  return { url, data };
}
