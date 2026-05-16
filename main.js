import { initModels } from "./assets/IA/Algorithm.js";
import { App } from "./assets/app.js";
console.log("\x1b[33m [ APP ]: \x1b[0m Iniciando aplicativo...");
App.listen(3000, () => console.log("\x1b[33m [ APP ]: \x1b[0m Rodando na porta 3000."));
initModels();
