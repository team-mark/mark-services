import { cryptoLib } from '@mark/utils';

export function getPAD(handle: string, passwordh: string) {
    const h1 = handle.charAt(0);
    const p1 = passwordh.charAt(0);
    const p = getAsciiValue(h1);
    const ad = getAsciiValue(p1);
    return `${p}.${ad}`;
}

export function getRefT(handle: string, passwordh: string, OTP: string): Promise<string> {
    // p = first letter (handle)
    // q = first letter (pass)
    // r = max - q
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    return cryptoLib.hash(`${handle}:${passwordh}:${OTP}`)
        .then(refT => Promise.resolve(refT));
}

export function getRefA(accountId: string, phoneh: string, handle: string, passwordh: string): Promise<string> {
    return cryptoLib.hash(`${accountId}:${phoneh}:${handle}:${passwordh}`)
        .then(z_w => Promise.resolve(z_w));
}

export function getRefI(z_a: string, walletAddress: string, passwordh: string): Promise<string> {
    return cryptoLib.hash(`${z_a}:${walletAddress}:${passwordh}`)
        .then(refI => Promise.resolve(refI));
}

export function getLinkQ(PAD: string, OTP: string): Promise<string> {
    const { p, ad } = getPADParts(PAD);
    return cryptoLib.hash(`${p}:${OTP}:${ad}`)
        .then(linkQ => Promise.resolve(linkQ));
}

export function getLinkR(handle: string, passwordh: string): Promise<string> {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    return cryptoLib.hash(`${p}:${handle}:${passwordh}:${ad}`)
        .then(linkR => Promise.resolve(linkR));
}

export function getLinkA(linkR: string, refA: string): string {
    const linkA = cryptoLib.XORAsciiStringsToHex(linkR, refA);
    return linkA;
}

export function getLinkW(linkQ: string, refW: string) {
    const linkW = cryptoLib.XORAsciiStringsToHex(linkQ, refW);
    return linkW;
}

export function getPADParts(PAD: string): { p: number, ad: number } {
    const [p, ad] = PAD.split('.');
    return {
        p: parseInt(p),
        ad: parseInt(ad)
    };
}

function getAsciiValue(char: string) {
    return char.charCodeAt(0);
}
