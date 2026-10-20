# Cardápio Cora

<img src="src/public/assets/images/logo.png" alt="Logo Cora" width="220" />

Sistema web para gestão de cardápio, rotinas de funcionamento e exibição em monitor para o ambiente de alimentação institucional.

<img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80" alt="Cafeteria" width="100%" />

## Visão Geral

O projeto foi desenvolvido para centralizar a administração de refeições e horários em um único ambiente, permitindo:

- gestão do cardápio por dia;
- controle do horário de funcionamento e rotinas;
- visualização em monitor para os usuários;
- painel administrativo protegido por autenticação;
- exibição de informações em tempo real para o público.

A aplicação combina backend em Node.js, interface web em HTML/CSS/JS e persistência local em arquivo JSON.

## Funcionalidades

### 1. Painel administrativo

- acesso por login;
- gerenciamento de cardápios;
- edição de informações do dia;
- configuração de rotinas e turnos;
- ajustes visuais do painel.

### 2. Monitor de exibição

- exibe o cardápio do dia;
- mostra o turno atual;
- sincroniza automaticamente com o banco local;
- atualiza informações sem necessidade de reload manual.

### 3. Gestão de rotinas

- organização por dia da semana;
- horários de almoço, turno e eventos especiais;
- suporte a mensagens e avisos de destaque.

### 4. Integração de voz/IA

- preparação para geração de texto para fala (TTS);
- uso de modelos e recursos de síntese de voz;
- arquitetura futura para automação mais inteligente.

## Stack Tecnológica

- Node.js
- TypeScript
- Express
- HTML5 + CSS3 + JavaScript
- Json-based local database
- Hugging Face Transformers
- espeak-ng
- CORS, body-parser, cookie-parser

## Arquitetura do Projeto

```text
cardapio-cora/
├── main.ts                    # Inicialização da aplicação
├── src/
│   ├── app.ts                 # Configuração do Express
│   ├── IA/                    # Processamento IA e TTS
│   ├── middlawere/            # Autenticação e middlewares
│   ├── public/                # Frontend estático
│   │   ├── _ADMIN/
│   │   ├── _LOGIN/
│   │   ├── _MONITOR/
│   │   └── assets/
│   ├── routes/                # Endpoints da API
│   ├── structures/            # Banco local e persistência
│   └── types/
├── package.json
├── start.bat
├── check-version.ps1
├── tsconfig.json
└── README.md
```

## Especificações Técnicas

### Backend

O backend está estruturado em rotas com Express, divididas por módulos:

- `/admin` — painel administrativo
- `/cardapio` — consultas e atualização do cardápio
- `/rotinas` — gestão de jornada e horários
- `/user` — autenticação e sessão do usuário
- `/monitor` — visualização pública do monitor

### Persistência

A base de dados é gerenciada por uma classe customizada em `src/structures/Database.ts`, que salva os dados em arquivo local no formato JSON. O projeto usa coleções como:

- `cardapio`
- `rotinas`
- `settings`
- `users`

### Segurança básica

A aplicação implementa autenticação por cookies e middleware de autorização em rotas sensíveis, com validação de token para acesso ao painel administrativo.

### Interface

O frontend está em arquivos estáticos dentro de `src/public`, organizados por módulos:

- login administrativo
- dashboard de administração
- visualização do monitor
- assets e mídia visual

## Requisitos

- Node.js 18+
- npm
- Sistema operacional com suporte a execução de scripts batch (`start.bat` para Windows)

## Instalação

1. Clone o repositório

```bash
git clone https://github.com/CoraTech-Projects/cardapio-cora.git
cd cardapio-cora
```

2. Instale as dependências

```bash
npm install
```

3. Inicie a aplicação

```bash
npm start
```

Ou, se preferir executar diretamente:

```bash
npx tsc
node .
```

## Execução e Acesso

Ao iniciar o servidor, a aplicação fica disponível em:

```text
http://localhost:3000
```

A rota principal redireciona para `/admin` e, caso o usuário não esteja autenticado, o sistema direciona para a tela de login.

## Endpoints Principais

### Cardápio

- `GET /cardapio` — retorna o cardápio do dia
- `GET /cardapio?all=true` — retorna todo o cardápio
- `POST /cardapio/inserir-cardapio` — insere novo item
- `POST /cardapio/update-cardapio` — atualiza item existente
- `DELETE /cardapio/delete-cardapio` — remove item

### Administração

- `GET /admin` — painel administrativo
- `GET /admin/settings` — retorna configurações
- `POST /admin/set-settings` — salva configurações

### Usuários

- `GET /user/login` — tela de login
- `POST /user/login` — autenticação
- `GET /user/logout` — encerramento da sessão

### Rotinas

- `GET /rotinas` — retorna programação semanal

## Exemplos Visuais

<img src="src/public/assets/images/ty.png" alt="Visual do sistema" width="100%" />

<img src="src/public/assets/images/logo.png" alt="Logo institucional" width="220" />

## Observações

- O projeto foi pensado como solução local e institucional, com foco em automação e exibição contínua.
- Há integração com recursos de IA e TTS, o que permite evoluções futuras para leitura em voz do cardápio e automação de comunicação.
- A aplicação usa arquivo local para persistência, sendo ideal para ambientes simples e autônomos.

## Licença

Este projeto está em desenvolvimento e pode ser usado para fins educacionais e internos.

## Autor

CoraTech Projects
