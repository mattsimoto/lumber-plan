# Free local analysis

LumberPlan uses open-source tools in the browser. No inference API, API key, paid provider, backend service, sign-in window or model-hosting account is required.

## Modes

**Read drawing text** uses Tesseract.js to recognize English labels. For PDFs, PDF.js first extracts embedded text from the selected page; OCR handles scanned pages. Explicit component rows are converted into reviewable suggestions, for example:

```text
4 legs, 2x4, 36 in
Long rails, 2x4, 48 in, qty 2
Cross rails, 2x4, 18 1/2 in, qty 3
```

The parser accepts labeled inches, feet, millimeters, centimeters and meters. Bare numbers without a unit remain unresolved. It does not infer arbitrary framing schedules or reconstruct blueprint geometry. OCR output is displayed for checking.

**Understand photo** also runs SmolVLM-500M-Instruct through Transformers.js on WebGPU. It produces a short unverified visual description and suggests common component groups such as legs, posts, rails, braces, shelves and seat boards. Model-generated measurements and counts are deliberately discarded. Fill these in from real measurements before applying the list.

Photo mode needs a compatible WebGPU browser/device and downloads several hundred MB on first use. Files are cached by the browser where supported. Performance and memory requirements vary; a model that loads on a desktop may fail on a phone. If photo understanding is unavailable, the app returns the text-recognition results with an explicit explanation. It does not call a paid API as a fallback.

## Files and privacy

The selected file and description are processed on the device. No upload or inference request is sent to an external AI service. The browser downloads open-source libraries, OCR language data and model weights from their public hosts, so first use requires internet access. It is not a guaranteed offline app.

Input files are limited to 15 MB. Images are resized to a maximum dimension of 2400 pixels for processing. PDFs are processed one selected page at a time, with the analyzed page stated in the result. The review shows OCR text, assumptions and missing information. Users confirm included component values before replacement of the cut list.

## Source and licenses

| Tool | Version / model revision | Source | License |
| --- | --- | --- | --- |
| Tesseract.js | 6.0.1 | https://github.com/naptha/tesseract.js | Apache-2.0 |
| PDF.js | 4.10.38 | https://github.com/mozilla/pdf.js | Apache-2.0 |
| Transformers.js | 3.8.1 | https://github.com/huggingface/transformers.js | Apache-2.0 |
| SmolVLM-500M-Instruct | a7da5b986cb59b408707209984f360a5f4ad7e47 | https://huggingface.co/HuggingFaceTB/SmolVLM-500M-Instruct | Apache-2.0 |

These dependencies are loaded at runtime rather than copied into this repository. `public/local-vision.worker.js` isolates photo inference from the interface and permits cancellation by terminating the worker. The Tesseract API pattern and Transformers model usage follow the upstream documentation and examples.

## Verification

```sh
pnpm test:analysis
pnpm exec tsc --noEmit
pnpm build:pages
```

The local tests cover component text parsing, fractions, unit conversion, missing quantities, and exclusion of measurements/counts invented by photo-model output. Build verification checks both static and hosted versions. Runtime library endpoints and model artifact availability are checked separately.

A real on-device GPU inference and OCR browser session still need confirmation on the target hardware. Image understanding remains experimental; no structural adequacy or verified hardware design is calculated.
