"""
Narration for the video stage. Offline neural text-to-speech (Kokoro-82M, Apache-2.0).

  python3 tts.py speak <segments.json> <out_dir> <model_dir> <voice> <speed>
      segments.json: [{"id": "s01-1", "text": "..."}]
      Writes <out_dir>/<id>.wav per segment and <out_dir>/timing.json:
      {"<id>": {"dur": seconds, "cues": [[start, end, sentence], ...]}}
  python3 tts.py mix <placements.json> <total_seconds> <out.wav>
      placements.json: [{"wav": path, "at": seconds}]

model_dir holds kokoro-q8.onnx and voices.npz (scripts/video/setup-tts.sh makes them).
Requires: pip install kokoro-onnx soundfile
"""
import json
import os
import re
import sys

import numpy as np
import soundfile as sf

SR = 24000
GAP = 0.28  # pause between sentences, seconds

# Say aviation acronyms the way an instructor would.
SAY = {
    r"\bIOSA\b": "eye-oh-sah",
    r"\bISARPs?\b": "eye-sarps",
    r"\bRBI\b": "R B I",
    r"\bSMS\b": "S M S",
    r"\bSPIs?\b": "S P I",
    r"\bQA\b": "Q A",
    r"\bSOPs?\b": "S O P",
    r"\bFMS\b": "F M S",
    r"\bTEM\b": "T E M",
    r"\bCRM\b": "C R M",
    r"\bICAO\b": "eye-kay-oh",
    r"\bATC\b": "A T C",
    r"\bNM\b": "nautical miles",
}


def spoken(text: str) -> str:
    for pat, rep in SAY.items():
        text = re.sub(pat, rep, text)
    return text


def sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p for p in (s.strip() for s in parts) if p]


def speak(seg_path, out_dir, model_dir, voice, speed):
    from kokoro_onnx import Kokoro

    k = Kokoro(os.path.join(model_dir, "kokoro-q8.onnx"), os.path.join(model_dir, "voices.npz"))
    lang = "en-us" if voice.startswith("a") else "en-gb"
    os.makedirs(out_dir, exist_ok=True)
    timing = {}
    for seg in json.load(open(seg_path)):
        chunks, cues, t = [], [], 0.0
        for s in sentences(seg["text"]):
            audio, sr = k.create(spoken(s), voice=voice, speed=speed, lang=lang)
            assert sr == SR
            chunks.append(audio.astype(np.float32))
            cues.append([round(t, 3), round(t + len(audio) / SR, 3), s])
            t += len(audio) / SR
            chunks.append(np.zeros(int(GAP * SR), np.float32))
            t += GAP
        audio = np.concatenate(chunks) if chunks else np.zeros(1, np.float32)
        sf.write(os.path.join(out_dir, seg["id"] + ".wav"), audio, SR)
        timing[seg["id"]] = {"dur": round(len(audio) / SR, 3), "cues": cues}
        print(seg["id"], timing[seg["id"]]["dur"], flush=True)
    json.dump(timing, open(os.path.join(out_dir, "timing.json"), "w"), indent=1)


def mix(place_path, total, out_wav):
    out = np.zeros(int(float(total) * SR) + SR, np.float32)
    for p in json.load(open(place_path)):
        a, sr = sf.read(p["wav"], dtype="float32")
        i = int(p["at"] * SR)
        out[i : i + len(a)] += a[: max(0, len(out) - i)]
    peak = float(np.max(np.abs(out))) or 1.0
    sf.write(out_wav, out * min(1.0, 0.89 / peak), SR)


if __name__ == "__main__":
    if sys.argv[1] == "speak":
        speak(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], float(sys.argv[6]))
    elif sys.argv[1] == "mix":
        mix(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        sys.exit(__doc__)
