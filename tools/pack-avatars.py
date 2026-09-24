#!/usr/bin/env python3
"""Rebuild the compressed avatar pack embedded in public/ace/index.html.

The 89 character SVGs repeat about 60% of their markup between them, so
storing them inline costs 4.7 MB. This packs them as:

    {"d": "<unique fragments joined by \\x01>", "r": ["<base36 indices>", ...]}

gzipped and base64'd, which comes to roughly 670 KB. The page rebuilds each
avatar on first use by joining the referenced fragments back with '><'.

Usage:  python3 tools/pack-avatars.py <source.html> > avatars.b64
where <source.html> is a build containing the inline `const AVATARS={...}`.
"""
import base64
import collections
import gzip
import json
import sys

SEP = "\x01"


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__, file=sys.stderr)
        return 2

    lines = open(sys.argv[1], encoding="utf-8").read().split("\n")
    avatars: dict[str, str] = {}
    for line in lines:
        line = line.strip()
        if not line.startswith('"hair-'):
            continue
        key, value = line.split(":", 1)
        avatars[json.loads(key)] = json.loads(value.rstrip().rstrip(","))
    if not avatars:
        print("no inline AVATARS found in that file", file=sys.stderr)
        return 1

    keys = sorted(avatars, key=lambda k: int(k.split("-")[1]))

    # Order fragments by frequency so the commonest get the shortest indices.
    freq: collections.Counter[str] = collections.Counter()
    for key in keys:
        freq.update(avatars[key].split("><"))
    order = [chunk for chunk, _ in freq.most_common()]
    index = {chunk: i for i, chunk in enumerate(order)}

    def b36(n: int) -> str:
        digits = "0123456789abcdefghijklmnopqrstuvwxyz"
        if n == 0:
            return "0"
        out = ""
        while n:
            out = digits[n % 36] + out
            n //= 36
        return out

    rows = [".".join(b36(index[c]) for c in avatars[k].split("><")) for k in keys]
    payload = json.dumps({"d": SEP.join(order), "r": rows}, separators=(",", ":")).encode()

    # Never ship a pack that does not rebuild byte for byte.
    restored = json.loads(payload)
    dictionary = restored["d"].split(SEP)
    for i, key in enumerate(keys):
        rebuilt = "><".join(dictionary[int(x, 36)] for x in restored["r"][i].split("."))
        assert rebuilt == avatars[key], f"round-trip failed for {key}"

    sys.stdout.write(base64.b64encode(gzip.compress(payload, 9)).decode())
    print(
        f"packed {len(keys)} avatars: "
        f"{len(payload) / 1024 / 1024:.2f} MB -> {len(gzip.compress(payload, 9)) / 1024:.0f} KB gzipped",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
