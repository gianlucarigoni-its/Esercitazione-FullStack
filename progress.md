# Progress — Esercitazione Fullstack 01

## 20/04/2026 — Setup + Backend avviato

### Contesto iniziale

- Repo base scaricata da GitHub (boilerplate del professore) — nessun `npm install` ancora eseguito
- Stack già configurato: **TypeScript**, **Express 5**, **ESM** (`"type": "module"`), **tsx** come runner (compila ed esegue TS al volo senza build step), **nodemon** per hot reload
- `npm install` eseguito — 138 pacchetti installati, 5 vulnerabilità ignorate intenzionalmente (progetto d'esame)
- Installate estensioni VS Code: **Prettier** (format on save) + **ESLint** (analisi statica)

### Struttura boilerplate compresa

- `src/index.ts` — entrypoint: crea il server HTTP, connette MongoDB con Mongoose, avvia il listen sulla porta 3000
- `src/app.ts` — configurazione middleware: `cors`, `morgan`, `body-parser`, smista il traffico `/api` verso il router
- `src/api/routes.ts` — router Express, per ora vuoto
- `src/utils/typed-request.ts` — utility del professore: interface `TypedRequest<B, Q, P>` che estende `Request` di Express per tipizzare body, query string e params in modo comodo

### Struttura creata

- `src/api/todo.model.ts` — Schema Mongoose + virtual `expired` + export del Model
- `src/api/todo.controller.ts` — funzioni che ricevono req/res e delegano al service
- `src/api/todo.service.ts` — logica di business e interazione col DB
- `src/api/todo.dto.ts` — `CompletedTodoDto` con `showCompleted?: string` per tipizzare la query string
- `src/entities/todo.entity.ts` — `TodoDocument` (campi reali DB) e `Todo extends TodoDocument` (aggiunge `expired` per la response)

### Concetti appresi

- **Mongoose Virtual**: campo calcolato a runtime, non persistito nel DB. Si definisce con `schema.virtual('campo').get(function() {...})`. Necessaria funzione normale (non arrow) perché `this` deve puntare al documento corrente — le arrow function ereditano `this` dal contesto esterno (lexical scope) e perdono il riferimento al documento
- **`toJSON: { virtuals: true }`**: opzione dello Schema per includere i virtual nella serializzazione JSON — senza questa opzione i virtual vengono ignorati nelle response HTTP
- **Separation of Concerns**: ogni file ha una sola responsabilità. Aggiunto layer Service (non richiesto esplicitamente) per separare logica di business dall'handling HTTP — motivazione: scalabilità e manutenibilità
- **Singleton pattern sul Service**: `export default new TodoSrv()` — si esporta l'istanza, non la classe, così il controller importa direttamente l'oggetto usabile
- **FilterQuery vs QueryFilter**: in Mongoose il tipo corretto per costruire query dinamiche è `FilterQuery<T>`, non `QueryFilter<T>`
- **Virtual e tipizzazione TypeScript**: i virtual non fanno parte del tipo inferito da Mongoose — richiedono due interface separate: `TodoDocument` per il DB e `Todo extends TodoDocument` per la response HTTP

### todo.model.ts — dettaglio

- Campi: `title` (String, required), `dueDate` (Date, opzionale), `completed` (Boolean, default: false)
- Virtual `expired`: restituisce `true` se `dueDate` esiste + `dueDate < now` + `completed === false`
- Export: `export const TodoModel = model("Todo", todoSchema)`

### todo.service.ts — dettaglio

- Metodo `find(filter: CompletedTodoDto)`: costruisce `FilterQuery` dinamicamente
- Default: filtra `completed: false` — rimuove il filtro solo se `filter.showCompleted === "true"`
- Export istanza: `export default new TodoSrv()`

### todo.controller.ts — dettaglio

- `getTodoList`: legge `req.query`, passa al service, risponde con `res.json(result)`
- Usa `TypedRequest<any, { showCompleted?: string }>` per tipizzare la query string

---

## 21/04/2026 — Backend completato + API testate + Script seed creato

### Funzioni implementate

#### todo.service.ts

- **`find(filter: ShowCompletedTodoDto): Promise<Todo[]>`**
  - Costruisce un `FilterQuery<Todo>` dinamicamente
  - Se `filter.showCompleted !== "true"` imposta `query.completed = false`
  - Comportamento corretto: `undefined !== "true"` → restituisce solo todo incompleti per default, conforme alla specifica OpenAPI (`default: false`)
  - Usa `TodoModel.find(query)` per interrogare MongoDB

- **`add(params: AddTodoDto): Promise<Todo>`**
  - Riceve `title` e `dueDate?` dal DTO
  - Forza `completed: false` con spread: `{ ...params, completed: false }`
  - Usa `TodoModel.create(toAdd)` per persistere nel DB
  - `completed` NON viene accettato dal client — è sempre impostato lato server

- **`check(id: idParams): Promise<Todo | null>`**
  - Cerca il documento con `TodoModel.findOne({ _id: id.id })`
  - Se esiste e `completed === false`: imposta `completed = true` e salva
  - Se non esiste o già completato: ritorna `null`

- **`uncheck(id: idParams): Promise<Todo | null>`**
  - Cerca il documento con `TodoModel.findOne({ _id: id.id })`
  - Se esiste e `completed === true`: imposta `completed = false` e salva
  - Se non esiste o già non completato: ritorna `null`

#### todo.controller.ts

- **`getTodoList`**: legge `req.query`, chiama `todoSrv.find()`, risponde `200` con array JSON
- **`addTodo`**: legge `req.body` (tipizzato con `AddTodoDto`), chiama `todoSrv.add()`, risponde `201` con il todo creato
- **`checkTodo`**: legge `req.params` (tipizzato con `idParams`), chiama `todoSrv.check()` — se `null` risponde `404`, altrimenti `200` + JSON
- **`uncheckTodo`**: identica logica di `checkTodo` ma chiama `todoSrv.uncheck()`

#### routes.ts

- Collegati tutti gli endpoint al router Express:
  ```
  GET    /todos              → getTodoList
  POST   /todos              → addTodo
  PATCH  /todos/:id/check    → checkTodo
  PATCH  /todos/:id/uncheck  → uncheckTodo
  ```
- Corretta distinzione tra `/check` e `/uncheck` come path separati (non stesso path con handler diversi)

### File modificati

#### todo.dto.ts

- Rinominato `CompletedTodoDto` → `ShowCompletedTodoDto` per maggiore chiarezza semantica
- Aggiunto `AddTodoDto` con `title: string` e `dueDate?: Date` — `completed` escluso intenzionalmente perché impostato sempre lato server

#### todo.entity.ts

- `dueDate` corretta da `Date | undefined` a `Date | null | undefined` — Mongoose serializza i campi opzionali come `null`, TypeScript richiedeva di accettarlo esplicitamente

#### todo.model.ts

- Aggiunto `transform` nella config `toJSON` per pulire la response:
  - Rimosso `_id` (sostituito da `id` generato dal virtual di Mongoose)
  - Rimosso `__v` (campo interno di versioning di Mongoose, non previsto dalla specifica)

### Test API con Postman — risultati

- ✅ `POST /api/todos` con `title` e `dueDate` → crea todo, `completed: false`, `expired` calcolato correttamente
- ✅ `POST /api/todos` senza `dueDate` → crea todo senza campo data (non incluso nel JSON se undefined)
- ✅ `GET /api/todos` → restituisce solo todo non completati
- ✅ `GET /api/todos?showCompleted=true` → include anche i completati
- ✅ `PATCH /api/todos/:id/check` → imposta `completed: true`, risponde `200`
- ✅ `PATCH /api/todos/:id/uncheck` → imposta `completed: false`, risponde `200`
- ✅ Response pulita: niente `_id`, niente `__v`

### Gestione errori — decisione architetturale

- Analizzati i tre scenari di errore su `findOne(id)`:
  1. Id ben formato + documento esistente → ritorna il documento
  2. Id ben formato + documento **non esistente** → ritorna `null` → gestito con `404` nel controller
  3. Id **malformato** → Mongoose lancia `CastError` prima di interrogare il DB
- **Express 5** gestisce automaticamente gli errori nelle route `async` — wrappa ogni handler in un `try/catch` interno e chiama `next(err)` automaticamente senza necessità di farlo manualmente (differenza chiave rispetto a Express 4)
- Decisione presa: **non implementare error handler globale** — comportamento conforme al progetto fatto in classe, `CastError` restituisce `500` di default. Scelta motivata dalla conformità con il codice visto a lezione e dall'ambito d'esame (no overengineering)
- Concetto appreso: error handler globale Express ha firma `(err, req, res, next)` — 4 parametri invece di 3, si registra in `app.ts` con `app.use()` dopo tutte le route

### Script seed — `scripts/seed.ts`

#### File creato

- **`backend/scripts/seed.ts`** — script standalone per popolare il database con dati fake a scopo di sviluppo. Posizionato fuori da `src/` perché non fa parte del codice di produzione

#### Dipendenza installata

- **`@faker-js/faker`** installato come `devDependency` con `npm install @faker-js/faker --save-dev`
- Motivo `--save-dev`: dipendenza necessaria solo in sviluppo, non in produzione. In `npm install --production` le `devDependencies` vengono ignorate
- Locale utilizzato: `@faker-js/faker/locale/it` per generare dati in italiano

#### Funzioni implementate

- **`generateRandomTodo()`**
  - `title`: generato con `faker.hacker.phrase()` / `faker.company.catchPhrase()` — testo in italiano (nota: `faker.lorem` genera sempre testo latino indipendentemente dal locale, non adatto per testi realistici)
  - `dueDate`: generato con `faker.date.soon({ days: 150 })` con probabilità 50% — condizione `if (faker.datatype.boolean())` per rendere il campo opzionale, `undefined` altrimenti
  - `completed`: generato con `faker.datatype.boolean({ probability: 0.3 })` — 30% di probabilità di essere `true`

- **`generateTodos(num: number)`**
  - Usa `Array.from({ length: num }, () => generateRandomTodo())` per generare array di N todo
  - Attenzione: usare `{}` nel corpo della arrow function senza `return` esplicito ritorna `void` → usare parentesi tonde `()` per implicit return oppure `return` esplicito
  - Chiama `TodoModel.create(data)` per inserimento bulk nel DB

#### Flusso dello script

1. Connessione a MongoDB con `mongoose.connect()`
2. Pulizia collection con `TodoModel.deleteMany({})` — garantisce DB pulito ad ogni esecuzione
3. Generazione e inserimento di 30 todo fake
4. Log di conferma + `process.exit()` per terminare il processo Node

#### Concetti appresi

- **`devDependencies` vs `dependencies`**: le `devDependencies` non vengono installate in produzione — utile per tool, linter, faker, test runner
- **`faker.lorem` e locale**: `lorem` genera sempre testo latino per design (è pseudo-testo segnaposto) — per testo realistico in italiano usare `faker.hacker`, `faker.company`, ecc.
- **`faker.datatype.boolean()`**: genera booleano casuale — accetta `{ probability: number }` per controllare la distribuzione (es. `0.3` = 30% `true`)
- **`faker.date.soon({ days, refDate })`**: genera una data nel futuro prossimo — `days` è il range, `refDate` è la data di riferimento in formato ISO 8601 (`YYYY-MM-DDThh:mm:ss.000Z` — attenzione all'ordine giorno/mese)
- **Implicit return nelle arrow function**: `() => valore` ritorna implicitamente. `() => { valore }` senza `return` ritorna `void`
- **`Array.from({ length: N }, fn)`**: pattern idiomatico JavaScript per generare array di N elementi tramite una funzione generatrice

---

### Prossimo step

- Inizio **frontend Angular**
- Struttura componenti da definire: lista, item, modal
- Setup proxy `/api` per development
- Installazione e configurazione **ng-bootstrap**
