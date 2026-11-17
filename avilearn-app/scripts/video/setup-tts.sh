#!/usr/bin/env bash
# One-time setup for video narration: Kokoro-82M (Apache-2.0) model and voices, offline.
# Everything comes from the npm and PyPI registries (no Hugging Face access needed).
#   bash scripts/video/setup-tts.sh            -> ../env/tmp/tts/{kokoro-q8.onnx,voices.npz}
set -euo pipefail
DIR="${1:-$(cd "$(dirname "$0")/../../.." && pwd)/env/tmp/tts}"
mkdir -p "$DIR" && cd "$DIR"
pip install -q kokoro-onnx soundfile
if [ ! -f kokoro-q8.onnx ]; then
  npm pack kokoro-q8-shards@1.0.0 --silent >/dev/null
  tar xzf kokoro-q8-shards-1.0.0.tgz
  cat package/kokoro-q8.part{0,1,2,3,4,5}.bin > kokoro-q8.onnx
  echo "fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478  kokoro-q8.onnx" | sha256sum -c -
  rm -rf package kokoro-q8-shards-1.0.0.tgz
fi
if [ ! -f voices.npz ]; then
  npm pack kokoro-local-runtime@0.1.0 --silent >/dev/null
  mkdir -p klr && tar xzf kokoro-local-runtime-0.1.0.tgz -C klr
  python3 - <<'EOF'
import glob, os, numpy as np
v = {os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256) for f in glob.glob('klr/package/voices/*.bin')}
np.savez('voices.npz', **v)
print(len(v), 'voices')
EOF
  rm -rf klr kokoro-local-runtime-0.1.0.tgz
fi
echo "TTS ready in $DIR"
