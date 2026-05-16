import * as ort from "onnxruntime-node";
import * as fs from "fs";
import * as path from "path";
const TTS_MODEL_PATH = path.resolve(process.cwd(), "assets", "IA", "models") + "/model.onnx";
const MODEL_PATH = path.resolve(process.cwd(), "assets", "IA", "models") + "/model-llm-4g.gguf";
let model;
let llm;
let prompt;
let cardapio;
let trainingData;
const VOWELS = "aeiouáàâãéêíóôõúü";
const ACCENTS = "áéíóúâêôãõ";
const CONFIG_PATH = "./assets/IA/models/model.onnx.json";
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const PHONEME_MAP = config.phoneme_id_map;
const SAMPLE_RATE = config.audio.sample_rate;
function initModels() {
    console.log("\x1b[32m [ MODEL ]: \x1b[0m Modelo onnx TTS sendo carregado...");
    ort.InferenceSession.create(TTS_MODEL_PATH).then((s) => {
        model = s;
        console.log("\x1b[32m [ MODEL ]: \x1b[0m Modelo carregado com sucesso.");
    }).catch((error) => {
        console.error("\x1b[31m [ MODEL ]: \x1b[0m Error loading model:", error);
    });
    console.log("\x1b[32m [ MODEL_LLAMA ]: \x1b[0m Modelo LLM sendo carregado...");
    //llm = await pipeline('text-generation', "onnx-community/Qwen3-0.6B-ONNX");
    console.log("\x1b[32m [ MODEL_LLAMA ]: \x1b[0m Modelo LLM carregado");
}
function toWavFile(audio) {
    const dataSize = audio.length * 2;
    const buffer = Buffer.alloc(44 + dataSize);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);
    for (let i = 0; i < audio.length; i++) {
        const s = Math.max(-1, Math.min(1, audio[i]));
        buffer.writeInt16LE(s < 0
            ? s * 0x8000
            : s * 0x7FFF, 44 + i * 2);
    }
    return buffer;
}
function normalizeText(text) {
    return text
        .normalize("NFC")
        .toLowerCase()
        .replace(/[“”‘’"'`´]/g, "")
        .replace(/[—–]/g, "-")
        .replace(/\s+/g, " ")
        .trim();
}
function normalizeNumbers(text) {
    const numbers = {
        "0": "zero",
        "1": "um",
        "2": "dois",
        "3": "três",
        "4": "quatro",
        "5": "cinco",
        "6": "seis",
        "7": "sete",
        "8": "oito",
        "9": "nove"
    };
    return text.replace(/\d/g, n => numbers[n] || n);
}
function isVowel(char) {
    return VOWELS.includes(char);
}
function isConsonant(char) {
    return /[bcdfghjklmnpqrstvwxyzç]/i.test(char);
}
function hasAccent(char) {
    return ACCENTS.includes(char);
}
function tokenize(text) {
    return (text.match(/[a-zà-ÿ]+|[.,!?;:]/gi) || []);
}
function syllabify(word) {
    const chars = Array.from(word);
    const syllables = [];
    let current = "";
    for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        current += c;
        const next = chars[i + 1] || "";
        const next2 = chars[i + 2] || "";
        const isVowelChar = isVowel(c);
        const nextIsVowel = isVowel(next);
        const next2IsVowel = isVowel(next2);
        const cluster = `${c}${next}`;
        if (isVowelChar) {
            if (!next ||
                nextIsVowel) {
                syllables.push(current);
                current = "";
                continue;
            }
            if (!nextIsVowel &&
                next2 &&
                next2IsVowel) {
                if (/^(br|cr|dr|fr|gr|pr|tr|vr|bl|cl|fl|gl|pl|qu|gu|ch|lh|nh)$/.test(cluster)) {
                    continue;
                }
                syllables.push(current);
                current = "";
                continue;
            }
            if (!nextIsVowel &&
                !next2) {
                syllables.push(current);
                current = "";
                continue;
            }
        }
    }
    if (current) {
        syllables.push(current);
    }
    return syllables.filter(Boolean);
}
function detectStress(word, syllables) {
    for (let i = 0; i < syllables.length; i++) {
        if ([...syllables[i]]
            .some(c => hasAccent(c))) {
            return i;
        }
    }
    if (syllables.length === 1) {
        return 0;
    }
    const cleaned = word
        .normalize("NFC")
        .replace(/[^a-záàâãéêíóôõúüç]/gi, "");
    if (/(a|e|o|em|ens|am|ão|ões|ãe|õe|ã)$/i.test(cleaned)) {
        return (syllables.length - 2);
    }
    return (syllables.length - 1);
}
function reduceVowels(syllables, stress) {
    return syllables.map((syl, i) => {
        if (i === stress) {
            return syl;
        }
        const normalized = syl
            .replace(/[áàâã]/g, "a")
            .replace(/[éê]/g, "e")
            .replace(/í/g, "i")
            .replace(/[óôõ]/g, "o")
            .replace(/[úü]/g, "u");
        if (i === syllables.length - 1) {
            return normalized;
        }
        return normalized
            .replace(/e$/g, "i")
            .replace(/o$/g, "u");
    });
}
function cleanPhonemes(text) {
    return text
        .normalize("NFC")
        .replace(/[^a-zA-Záàâãéêíóôõúüçɲʎʃʒɾɐə ]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function applyPhonology(text) {
    const rules = [
        { pattern: /nh/g, replace: "ɲ" },
        { pattern: /lh/g, replace: "ʎ" },
        { pattern: /ch/g, replace: "ʃ" },
        { pattern: /ss/g, replace: "s" },
        { pattern: /gue/g, replace: "ge" },
        { pattern: /gui/g, replace: "gi" },
        { pattern: /qua/g, replace: "kwa" },
        { pattern: /quo/g, replace: "kwo" },
        { pattern: /que/g, replace: "ke" },
        { pattern: /qui/g, replace: "ki" },
        { pattern: /ge/g, replace: "ʒe" },
        { pattern: /gi/g, replace: "ʒi" },
        { pattern: /ce/g, replace: "se" },
        { pattern: /ci/g, replace: "si" },
        { pattern: /ca/g, replace: "ka" },
        { pattern: /co/g, replace: "ko" },
        { pattern: /cu/g, replace: "ku" },
        { pattern: /ç/g, replace: "s" },
        { pattern: /j/g, replace: "ʒ" },
        { pattern: /(^|\s|[.,;:!?-])r/g, replace: "$1h" },
        { pattern: /rr/g, replace: "h" },
        { pattern: /r([aeiouáàâãéêíóôõúü])/g, replace: "ɾ$1" },
        { pattern: /r\b/g, replace: "ɾ" },
        { pattern: /([aeiouáàâãéêíóôõúü])s([aeiouáàâãéêíóôõúü])/g, replace: "$1z$2" },
        { pattern: /s(?=[bdgmnv])/g, replace: "z" },
        { pattern: /s(?=[ptkbdgfv])/g, replace: "s" },
        { pattern: /(^|\s)x([aeiouáàâãéêíóôõúü])/g, replace: "$1ʃ$2" },
        { pattern: /x/g, replace: "ks" },
        { pattern: /ti([iíeéê])/g, replace: "tʃ$1" },
        { pattern: /di([iíeéê])/g, replace: "dʒ$1" },
        { pattern: /ão/g, replace: "ɐ̃w" },
        { pattern: /ãe/g, replace: "ɐ̃j" },
        { pattern: /õe/g, replace: "õj" },
        { pattern: /h/g, replace: "" }
    ];
    return rules.reduce((value, rule) => value.replace(rule.pattern, rule.replace), text);
}
function processWord(word) {
    const normalized = word.toLowerCase();
    const syllables = syllabify(normalized);
    const stress = detectStress(normalized, syllables);
    const reduced = reduceVowels(syllables, stress);
    let phonemes = reduced.join("");
    phonemes =
        applyPhonology(phonemes);
    phonemes =
        cleanPhonemes(phonemes);
    return {
        raw: word,
        normalized,
        phonemes
    };
}
function punctuationPause(token) {
    switch (token) {
        case ",":
            return " , ";
        case ".":
            return " . ";
        case "!":
            return " ! ";
        case "?":
            return " ? ";
        case ";":
            return " , ";
        default:
            return " ";
    }
}
function phonemize(text) {
    text =
        normalizeText(text);
    text =
        normalizeNumbers(text);
    const tokens = tokenize(text);
    const output = [];
    for (const token of tokens) {
        if (/^[.,!?;:]$/.test(token)) {
            output.push(punctuationPause(token));
            continue;
        }
        const word = processWord(token);
        output.push(word.phonemes);
    }
    return output
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}
function toIds(phonemes, pmap) {
    const ids = [];
    // BOS
    ids.push(pmap["^"][0]);
    // initial pause
    ids.push(pmap["_"][0]);
    for (const char of Array.from(phonemes)) {
        // SPACE
        if (char === " ") {
            ids.push(pmap["_"][0]);
            continue;
        }
        let mapped = pmap[char];
        // FALLBACKS
        if (!mapped) {
            const fallback = {
                "á": "a",
                "à": "a",
                "â": "a",
                "ã": "a",
                "é": "e",
                "ê": "e",
                "í": "i",
                "ó": "o",
                "ô": "o",
                "õ": "o",
                "ú": "u",
                "ç": "s"
            };
            const alt = fallback[char];
            if (alt &&
                pmap[alt]) {
                mapped =
                    pmap[alt];
            }
        }
        if (mapped &&
            mapped.length) {
            ids.push(mapped[0]);
            // separator
            ids.push(pmap["_"][0]);
        }
    }
    // EOS
    ids.push(pmap["$"][0]);
    return ids;
}
async function generate(text) {
    console.log("Loading model...");
    const phonemes = phonemize(text);
    console.log("[PHONEMES]");
    console.log(phonemes);
    const ids = toIds(phonemes, PHONEME_MAP);
    console.log("[TOKENS]", ids.length);
    const feeds = {
        input: new ort.Tensor("int64", BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
        input_lengths: new ort.Tensor("int64", BigInt64Array.from([
            BigInt(ids.length)
        ]), [1]),
        scales: new ort.Tensor("float32", Float32Array.from([
            // noise
            0.667,
            // speed
            1.25,
            // variation
            0.15
        ]), [3])
    };
    console.log("Running inference...");
    const result = await model.run(feeds);
    const audio = result.output
        .data;
    return toWavFile(audio);
}
export { initModels, generate, phonemize };
