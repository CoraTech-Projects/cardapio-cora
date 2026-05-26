import * as ort from "onnxruntime-node";
import { EsmPreTrainedModel, pipeline } from "@huggingface/transformers";
import ESpeakNg from "espeak-ng";
import * as fs from "fs";
import * as path from "path";

const TTS_MODEL_PATH = path.resolve(process.cwd(), "assets", "IA", "models") + "/model.onnx";
const MODEL_PATH = path.resolve(process.cwd(), "assets", "IA", "models") + "/model-llm-4g.gguf";
let model: ort.InferenceSession;
let llm: any;
let prompt: string;
let cardapio: string;
let trainingData: string;

const CONFIG_PATH =
    "./assets/IA/models/model.onnx.json";

const config = JSON.parse(
    fs.readFileSync(
        CONFIG_PATH,
        "utf8"
    )
);

const SAMPLE_RATE = config.audio.sample_rate;
const phonemeIdMap: Record<string, number[]> = config.phoneme_id_map;

function initModels(): void {
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

function toWavHeader(
    audio: Float32Array
): Buffer {

    const dataSize =
        audio.length * 2;

    const buffer =
        Buffer.alloc(
            44 + dataSize
        );

    buffer.write(
        "RIFF",
        0
    );

    buffer.writeUInt32LE(
        36 + dataSize,
        4
    );

    buffer.write(
        "WAVE",
        8
    );

    buffer.write(
        "fmt ",
        12
    );

    buffer.writeUInt32LE(
        16,
        16
    );

    buffer.writeUInt16LE(
        1,
        20
    );

    buffer.writeUInt16LE(
        1,
        22
    );

    buffer.writeUInt32LE(
        SAMPLE_RATE,
        24
    );

    buffer.writeUInt32LE(
        SAMPLE_RATE * 2,
        28
    );

    buffer.writeUInt16LE(
        2,
        32
    );

    buffer.writeUInt16LE(
        16,
        34
    );

    buffer.write(
        "data",
        36
    );

    buffer.writeUInt32LE(
        dataSize,
        40
    );

    for (
        let i = 0;
        i < audio.length;
        i++
    ) {

        const s = Math.max(
            -1,
            Math.min(
                1,
                audio[i]
            )
        );

        buffer.writeInt16LE(

            s < 0
                ? s * 0x8000
                : s * 0x7FFF,

            44 + i * 2
        );
    }

    return buffer;
}

async function generateTTS(
    text: string
): Promise<Buffer | any> {
    text = text.replace(/_/g, " ").replace(/;/g, ",");

    console.log("\x1b[34m [ TTS ]: \x1b[0m Gerando áudio para o texto:", text);

   const espeak = await ESpeakNg({
  arguments: [
    "--phonout",
    "generated",
    '--sep=""',
    "-q",
    "-b=1",
    `--ipa=3`,
    "-v",
    "pt-br",
    text,
  ],
});

    const rawIpa = espeak.FS.readFile("generated", { encoding: "utf8" });
    console.log("\x1b[34m [ TTS ]: \x1b[0m Texto convertido para fonemas IPA:", rawIpa);

    const ids: number[] = [];
    const BLANK_ID = phonemeIdMap["_"][0];
    const phonemes: Array<string> = Array.from(rawIpa);
    if (phonemeIdMap["^"]) ids.push(phonemeIdMap["^"][0]);
    ids.push(BLANK_ID);

    for (const p of phonemes) {
        if (phonemeIdMap[p]) {
            ids.push(...phonemeIdMap[p]);
            ids.push(BLANK_ID);
        } else if (p === " ") {
            if (phonemeIdMap[" "]) ids.push(phonemeIdMap[" "][0]);
            ids.push(BLANK_ID);
        }
    }
    if (phonemeIdMap["$"]) ids.push(phonemeIdMap["$"][0]);

    if (ids.length < 5) return;

    
    const feeds = {
        input: new ort.Tensor("int64", BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
        input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
        scales: new ort.Tensor("float32", Float32Array.from([0.667, 1.2, 0.8]), [3])
    };

    const results = await model.run(feeds);
    const outputAudio = results.output.data as Float32Array;

    
    let max = 0;
    for (let i = 0; i < outputAudio.length; i++) {
        const abs = Math.abs(outputAudio[i]);
        if (abs > max) max = abs;
    }
    if (max > 1.0) {
        for (let i = 0; i < outputAudio.length; i++) outputAudio[i] /= max;
    }

    return toWavHeader(outputAudio);
}

export {
    initModels,
    generateTTS
}