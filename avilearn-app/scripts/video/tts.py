"""
Narration for the video stage. Two engines:
  - ElevenLabs (default): named voices in ELEVEN_VOICES, e.g. "george" (default) or "alice".
    Needs network access to api.elevenlabs.io and the key in ELEVENLABS_API_KEY
    (in a cloud session with the key stored as an environment secret, the proxy adds it).
    Audio is cached by text + voice + speed in <out_dir>/../voice-cache, so a re-export
    does not spend characters again.
  - Kokoro-82M (offline fallback, Apache-2.0): any Kokoro voice id, e.g. bm_george.

  python3 tts.py speak <segments.json> <out_dir> <model_dir> <voice> <speed>
      segments.json: [{"id": "s01-1", "text": "..."}]
      Writes <out_dir>/<id>.wav per segment and <out_dir>/timing.json:
      {"<id>": {"dur": seconds, "cues": [[start, end, sentence], ...]}}
  python3 tts.py mix <placements.json> <total_seconds> <out.wav>
      placements.json: [{"wav": path, "at": seconds}]

model_dir (Kokoro only) holds kokoro-q8.onnx and voices.npz (scripts/video/setup-tts.sh makes them).
Requires: pip install kokoro-onnx soundfile
"""
import base64
import hashlib
import json
import os
import re
import sys
import urllib.request

import numpy as np
import soundfile as sf

SR = 24000
GAP = 0.28  # pause between sentences, seconds

# Kokoro only: say aviation acronyms the way an instructor would.
# ElevenLabs reads RBI, SMS and QA naturally from plain text.
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


ELEVEN_MODEL = "eleven_v4"
ELEVEN_VOICES = {
    "george": "JBFqnCBsd6RMkjVDRZzb",  # British male, warm storyteller (default)
    "alice": "Xb7hH8MSUJpSbSDYk0k2",  # British female, clear educator (alternate)
}


def is_eleven(voice: str) -> bool:
    return voice in ELEVEN_VOICES


def eleven(text, voice, speed):
    """One request per segment, so the voice keeps its phrasing across sentences.
    Returns (float32 audio at SR, characters, start times)."""
    body = {"text": text, "model_id": ELEVEN_MODEL}
    if speed != 1.0:
        body["voice_settings"] = {"speed": max(0.7, min(1.2, speed))}
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVEN_VOICES[voice]}/with-timestamps?output_format=pcm_{SR}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    if os.environ.get("ELEVENLABS_API_KEY"):
        req.add_header("xi-api-key", os.environ["ELEVENLABS_API_KEY"])
    with urllib.request.urlopen(req, timeout=180) as r:
        d = json.load(r)
    audio = np.frombuffer(base64.b64decode(d["audio_base64"]), "<i2").astype(np.float32) / 32768
    al = d.get("alignment") or {}
    return audio, al.get("characters", []), al.get("character_start_times_seconds", [])


def speak_eleven(segs, out_dir, voice, speed):
    cache = os.path.join(os.path.dirname(os.path.abspath(out_dir)), "voice-cache")
    os.makedirs(cache, exist_ok=True)
    timing = {}
    for seg in segs:
        text = " ".join(sentences(seg["text"]))
        h = hashlib.sha1(f"{ELEVEN_MODEL}|{voice}|{speed}|{text}".encode()).hexdigest()[:16]
        wav, meta = os.path.join(cache, h + ".wav"), os.path.join(cache, h + ".json")
        if os.path.exists(wav) and os.path.exists(meta):
            audio, _ = sf.read(wav, dtype="float32")
            chars, starts = json.load(open(meta))
        else:
            audio, chars, starts = eleven(text, voice, speed)
            sf.write(wav, audio, SR)
            json.dump([chars, starts], open(meta, "w"))
        dur = len(audio) / SR
        # Caption cues: each sentence starts at the time of its first character.
        cues, pos = [], 0
        for s in sentences(seg["text"]):
            i = text.find(s, pos)
            pos = i + len(s)
            t0 = starts[i] if 0 <= i < len(starts) else (cues[-1][1] if cues else 0.0)
            if cues:
                cues[-1][1] = round(t0, 3)
            cues.append([round(t0, 3), round(dur, 3), s])
        audio = np.concatenate([audio, np.zeros(int(GAP * SR), np.float32)])
        sf.write(os.path.join(out_dir, seg["id"] + ".wav"), audio, SR)
        timing[seg["id"]] = {"dur": round(len(audio) / SR, 3), "cues": cues}
        print(seg["id"], timing[seg["id"]]["dur"], flush=True)
    return timing


def speak(seg_path, out_dir, model_dir, voice, speed):
    os.makedirs(out_dir, exist_ok=True)
    segs = json.load(open(seg_path))
    if is_eleven(voice):
        timing = speak_eleven(segs, out_dir, voice, speed)
        json.dump(timing, open(os.path.join(out_dir, "timing.json"), "w"), indent=1)
        return
    from kokoro_onnx import Kokoro

    k = Kokoro(os.path.join(model_dir, "kokoro-q8.onnx"), os.path.join(model_dir, "voices.npz"))
    lang = "en-us" if voice.startswith("a") else "en-gb"
    timing = {}
    for seg in segs:
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
