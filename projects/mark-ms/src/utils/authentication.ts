
export function getPAD(handle: string, passwordh: string) {
    const h1 = handle.charAt(0);
    const p1 = passwordh.charAt(0);
    const p = getAsciiValue(h1);
    const ad = getAsciiValue(p1);
    return `${p}.${ad}`;
}

export function getZ_t(handle: string, passwordh: string, OTP: string): string {
    // p = first letter (handle)
    // q = first letter (pass)
    // r = max - q
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const z_t = ''; // blake2(handle:password:OTP) walk (p^r) times
    return z_t;
}

export function getZ_a(accountId: string, phoneh: string, handle: string, passwordh: string): string {
    const z_a = ''; // blake2(accountId:phoneh:handle:passwordh)
    return z_a;
}

export function getZ_w(z_a: string, walletId: string, passwordh: string): string {
    const z_w = ''; // blake2(z_a:walletId:?password?)
    return z_w;
}

export function getLink_q(PAD: string, OPT: string): string {
    const { p, ad } = getPADParts(PAD);
    const link_q = ''; // blake2(p:OTP:ad) walk (p^ad) times
    return link_q;
}

export function getLink_r(PAD: string, handle: string, passwordh: string): string {
    const { p, ad } = getPADParts(PAD);
    const link_r = ''; // blake2(p:handle:password:ad) walk (p^ad) times
    return link_r;
}

export function getLink_a(link_r: string, z_a: string) {
    // return link_q XOR z_a
}

export function getLink_w(link_q: string, z_w: string) {
    // return link_q XOR z_w
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