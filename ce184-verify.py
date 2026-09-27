#!/usr/bin/env python3
import base64
import hashlib
import json
import re
import sys

from asn1crypto import x509
from ecpy.curves import Curve
from ecpy.ecdsa import ECDSA
from ecpy.eddsa import EDDSA
from ecpy.keys import ECPublicKey

OID_ECDSA = "1.2.840.10045.2.1"
OID_ED521 = "1.3.6.1.4.1.44588.2.1"

def fail(code, detail=None):
    out = {"ok": False, "valid": False, "error": code}
    if detail:
        out["detail"] = str(detail)[:240]
    print(json.dumps(out, separators=(",", ":")))
    raise SystemExit(0)

def clean_hex(value, name, max_chars):
    s = re.sub(r"\s+", "", str(value or "")).upper()
    if not s or len(s) > max_chars or len(s) % 2 or not re.fullmatch(r"[0-9A-F]+", s):
        fail("invalid_" + name)
    return s

def certificate_der(certificate_hex):
    raw = bytes.fromhex(certificate_hex)
    try:
        x509.Certificate.load(raw)
        return raw
    except Exception:
        pass
    try:
        txt = raw.decode("ascii")
        m = re.search(r"-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----", txt, re.S)
        if not m:
            fail("invalid_certificate")
        body = re.sub(r"\s+", "", m.group(1))
        der = base64.b64decode(body, validate=True)
        x509.Certificate.load(der)
        return der
    except SystemExit:
        raise
    except Exception as exc:
        fail("invalid_certificate", exc)

def extract_key(cert_der):
    try:
        cert = x509.Certificate.load(cert_der)
        spki = cert["tbs_certificate"]["subject_public_key_info"]
        oid = spki["algorithm"]["algorithm"].dotted
        bit_contents = spki["public_key"].contents
        if not bit_contents or bit_contents[0] != 0:
            fail("invalid_public_key_bits")
        key_bytes = bytes(bit_contents[1:])
        if oid == OID_ECDSA:
            curve = Curve.get_curve("secp521r1")
            return ECPublicKey(curve.decode_point(key_bytes)), ECDSA(), oid, "ECDSA-P521", key_bytes
        if oid == OID_ED521:
            curve = Curve.get_curve("Ed521")
            return ECPublicKey(curve.decode_point(key_bytes)), EDDSA(hashlib.shake_256, hash_len=132), oid, "EdDSA-Ed521", key_bytes
        fail("unsupported_public_key_algorithm", oid)
    except SystemExit:
        raise
    except Exception as exc:
        fail("public_key_extract_failed", exc)

def main():
    try:
        req = json.load(sys.stdin)
    except Exception:
        fail("invalid_json")

    hash_hex = clean_hex(req.get("hashHex"), "hash", 128)
    if len(hash_hex) != 128:
        fail("invalid_hash_length")

    signature_hex = clean_hex(req.get("signatureHex"), "signature", 2048)
    certificate_hex = clean_hex(req.get("certificateHex"), "certificate", 32768)

    cert_der = certificate_der(certificate_hex)
    public_key, verifier, oid, algorithm, key_bytes = extract_key(cert_der)

    hash_bytes = bytes.fromhex(hash_hex)
    signature = bytes.fromhex(signature_hex)

    # O manual do TSE verifica a assinatura sobre SHA-512(bytes do HASH final).
    message = hashlib.sha512(hash_bytes).digest()

    try:
        valid = bool(verifier.verify(message, signature, public_key))
    except Exception as exc:
        fail("signature_verify_error", exc)

    result = {
        "ok": valid,
        "valid": valid,
        "algorithm": algorithm,
        "oid": oid,
        "certificateSha256": hashlib.sha256(cert_der).hexdigest().upper(),
        "publicKeySha512": hashlib.sha512(key_bytes).hexdigest().upper(),
    }
    if not valid:
        result["error"] = "signature_invalid"
    print(json.dumps(result, separators=(",", ":")))

if __name__ == "__main__":
    main()
