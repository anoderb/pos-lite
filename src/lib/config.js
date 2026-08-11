// Runtime config — env-driven, no hardcoded org names.
// All values fall back to neutral placeholders; override via .env.local (see .env.example).

export const HF_REPO = process.env.NEXT_PUBLIC_HF_REPO || 'your-org/dataset-name';

export const HF_DATASET_URL = `https://huggingface.co/datasets/${HF_REPO}`;

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'WebPOS';

export const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || 'Smart POS for modern retail';