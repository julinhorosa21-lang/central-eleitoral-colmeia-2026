#!/usr/bin/env python3
import base64
import hashlib
import json
import re
import sys

import asn1tools
from asn1crypto import x509 as asn1_x509
from ecpy.curves import Curve
from ecpy.ecdsa import ECDSA
from ecpy.eddsa import EDDSA
from ecpy.keys import ECPublicKey

OID_ECDSA = "1.2.840.10045.2.1"
OID_ED521 = "1.3.6.1.4.1.44588.2.1"

_SUBJECT_PUBLIC_KEY_INFO_ASN1 = """
SubjectPublicKeyInfo DEFINITIONS ::= BEGIN
SubjectPublicKeyInfo ::= SEQUENCE {
  algorithm AlgorithmIdentifier,
  subjectPublicKey BIT STRING
}
AlgorithmIdentifier ::= SEQUENCE {
  algorithm OBJECT IDENTIFIER,
  parameters ANY OPTIONAL
}
END
"""
_SUBJECT_PUBLIC_KEY_INFO_DECODER = asn1tools.compile_string(
    _SUBJECT_PUBLIC_KEY_INFO_ASN1, codec="der"
)

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

def extract_certificate(certificate_hex):
    raw = bytes.fromhex(certificate_hex)
    try:
        asn1_x509.Certificate.load(raw)
        return raw
    except Exception:
        pass

    try:
        text = raw.decode("ascii")
        match = re.search(
            r"-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----",
            text,
            re.DOTALL,
        )
        if not match:
            fail("invalid_certificate")
        body = re.sub(r"\s+", "", match.group(1))
        der = base64.b64decode(body, validate=True)
        asn1_x509.Certificate.load(der)
        return der
    except SystemExit:
        raise
    except Exception as exc:
        fail("invalid_certificate", exc)

def extract_public_key(cert_der):
    try:
        cert = asn1_x509.Certificate.load(cert_der)
        spki_bytes = cert["tbs_certificate"]["subject_public_key_info"].dump()
        spki = _SUBJECT_PUBLIC_KEY_INFO_DECODER.decode(
            "SubjectPublicKeyInfo", spki_bytes
        )
        oid = str(spki["algorithm"]["algorithm"])
        pubkey_bytes = spki["subjectPublicKey"][0]

        if oid == OID_ECDSA:
            curve = Curve.get_curve("secp521r1")
            pubkey = ECPublicKey(curve.decode_point(pubkey_bytes))
            return pubkey, ECDSA(), oid, "ECDSA-P521", pubkey_bytes

        if oid == OID_ED521:
            curve = Curve.get_curve("Ed521")
            pubkey = ECPublicKey(curve.decode_point(pubkey_bytes))
            verifier = EDDSA(hashlib.shake_256, hash_len=132)
            return pubkey, verifier, oid, "EdDSA-Ed521", pubkey_bytes

        fail("unsupported_public_key_algorithm", oid)
    except SystemExit:
        raise
    except Exception as exc:
        fail("public_key_extract_failed", exc)

def main():
    try:
        request = json.load(sys.stdin)
    except Exception:
        fail("invalid_json")

    hash_hex = clean_hex(request.get("hashHex"), "hash", 128)
    if len(hash_hex) != 128:
        fail("invalid_hash_length")

    signature_hex = clean_hex(request.get("signatureHex"), "signature", 4096)
    certificate_hex = clean_hex(request.get("certificateHex"), "certificate", 65536)

    cert_der = extract_certificate(certificate_hex)
    public_key, verifier, oid, algorithm, public_key_bytes = extract_public_key(cert_der)

    hash_bytes = bytes.fromhex(hash_hex)
    signature = bytes.fromhex(signature_hex)

    # Manual TSE 2026, item 1.6.3.1:
    # a mensagem verificada é SHA-512(bytes do HASH final do QRBU).
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
        "publicKeySha512": hashlib.sha512(public_key_bytes).hexdigest().upper(),
    }
    if not valid:
        result["error"] = "signature_invalid"

    print(json.dumps(result, separators=(",", ":")))

if __name__ == "__main__":
    main()
