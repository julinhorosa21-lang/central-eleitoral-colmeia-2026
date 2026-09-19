#!/usr/bin/env python3
import sys, json, binascii, hashlib, base64, re
import asn1tools
from ecpy.curves import Curve
from ecpy.ecdsa import ECDSA
from ecpy.eddsa import EDDSA
from ecpy.keys import ECPublicKey
from asn1crypto import x509 as asn1_x509

SPKI_ASN1 = """
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
SPKI_DECODER = asn1tools.compile_string(SPKI_ASN1, codec="der")

def cert_der_from_hex(cert_hex):
    raw=binascii.unhexlify(cert_hex.strip())
    try:
        asn1_x509.Certificate.load(raw)
        return raw
    except Exception:
        text=raw.decode("ascii")
        m=re.search(r"-----BEGIN CERTIFICATE-----(.*?)-----END CERTIFICATE-----", text, re.DOTALL)
        if not m:
            raise ValueError("invalid_certificate")
        der=base64.b64decode(re.sub(r"\s+","",m.group(1)))
        asn1_x509.Certificate.load(der)
        return der

def extract_verifier(cert_der):
    cert=asn1_x509.Certificate.load(cert_der)
    spki_bytes=cert["tbs_certificate"]["subject_public_key_info"].dump()
    spki=SPKI_DECODER.decode("SubjectPublicKeyInfo", spki_bytes)
    oid=spki["algorithm"]["algorithm"]
    pubkey_bytes=spki["subjectPublicKey"][0]
    if oid=="1.2.840.10045.2.1":
        curve=Curve.get_curve("secp521r1")
        return ECPublicKey(curve.decode_point(pubkey_bytes)), ECDSA(), "ECDSA-P521", oid
    if oid=="1.3.6.1.4.1.44588.2.1":
        curve=Curve.get_curve("Ed521")
        return ECPublicKey(curve.decode_point(pubkey_bytes)), EDDSA(hashlib.shake_256, hash_len=132), "EdDSA-Ed521", oid
    raise ValueError("unsupported_public_key_algorithm")

def main():
    try:
        req=json.load(sys.stdin)
        cert_hex=str(req.get("certHex","")).strip()
        sig_hex=str(req.get("signatureHex","")).strip()
        hash_hex=str(req.get("hashHex","")).strip()
        if not cert_hex or len(cert_hex)>24000 or len(cert_hex)%2 or not re.fullmatch(r"[0-9A-Fa-f]+",cert_hex):
            raise ValueError("invalid_certificate_hex")
        if not sig_hex or len(sig_hex)>1200 or len(sig_hex)%2 or not re.fullmatch(r"[0-9A-Fa-f]+",sig_hex):
            raise ValueError("invalid_signature_hex")
        if len(hash_hex)!=128 or not re.fullmatch(r"[0-9A-Fa-f]{128}",hash_hex):
            raise ValueError("invalid_hash_hex")
        cert_der=cert_der_from_hex(cert_hex)
        pubkey, verifier, algorithm, oid=extract_verifier(cert_der)
        signature=binascii.unhexlify(sig_hex)
        hash_bytes=binascii.unhexlify(hash_hex)
        message=hashlib.sha512(hash_bytes).digest()
        valid=bool(verifier.verify(message, signature, pubkey))
        out={"ok":True,"valid":valid,"algorithm":algorithm,"oid":oid}
    except Exception as e:
        out={"ok":False,"valid":False,"error":str(e)}
    sys.stdout.write(json.dumps(out,separators=(",",":")))

if __name__=="__main__":
    main()
