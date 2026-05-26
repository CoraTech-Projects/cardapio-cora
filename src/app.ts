/**
 * Bibliotecas do projeto
 */
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import data from "./structures/Database.js";
import "./utils/tempManage.js";

/**
 * Configuração do banco de dados (usando a estrutura personalizada Database) para armazenar o cardápio. O banco de dados é persistente e armazena os dados em um arquivo chamado "cardapio.data".
 */
const db = new data.Database("cardapio.data", true);
/**
 * Rotas da API (ENDPOINTS).
 */ 
 import { AdmRouter } from "./routes/Adm.js";


/** 
 * Rotas para funções middlaweres.
 */

const App = express();

App.use(express.static('./public'));
App.use(bodyParser.json({ limit: "10mb" }));
App.use(cors());

/**
 * Configuração de middlaweres.
 */
 
//App.use();

/**
 * Definição das rotas.
 */

App.use("/adm", AdmRouter);
App.get("/pages/:page", async (req: any, res: any) => {
    const page = req.params.page || "main";

    if(fs.existsSync(path.resolve(process.cwd(), "assets", "public", "pages") + `/${page}`)) {
        res.sendFile(path.resolve(process.cwd(), "assets", "public", "pages") + `/${page}`);
    } else {
        res.status(404).send("Página não encontrada");
    }
});

export { App, db };