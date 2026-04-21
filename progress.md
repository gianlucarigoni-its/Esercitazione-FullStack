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

## 21/04/2026 — Backend completato + API testate

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

### Concetti appresi

- **HTTP: una sola risposta per richiesta** — chiamare `res.send()` e poi `res.json()` sulla stessa risposta causa errore `Cannot set headers after they are sent to the client`. Anche concatenare `.send().json()` è sbagliato — `send()` chiude già la risposta
- **Status code semantici**: `200` per operazioni riuscite, `201` per creazione risorsa, `404` per risorsa non trovata
- **`_id` vs `id` in Mongoose**: MongoDB salva l'identificatore come `_id` (ObjectId). Mongoose espone automaticamente `id` come virtual stringa. Nel `transform` si elimina `_id` e si mantiene `id`
- **`__v` in Mongoose**: campo di versioning interno usato da Mongoose per gestire conflitti su array annidati. Non va mai esposto nelle API
- **`toJSON.transform`**: funzione `(doc, ret) => ret` che intercetta la serializzazione JSON del documento. `doc` è il documento Mongoose originale, `ret` è l'oggetto plain JS che verrà serializzato — si può modificare liberamente prima del return
- **`populate()` in Mongoose** (concetto trasversale): risolve riferimenti `ObjectId` verso altri documenti. Richiede `ref: 'NomeCollection'` nello schema. Non utilizzato in questo progetto (nessuna relazione tra collection)
- **`format: date` OpenAPI**: corrisponde allo standard ISO 8601 → formato `YYYY-MM-DD`
- **MongoDB crea il database automaticamente**: non serve creare il DB manualmente, viene creato al primo documento inserito
- **`mongoose.set('debug', true)`**: stampa in console ogni query eseguita da Mongoose — utile in sviluppo per verificare cosa viene realmente inviato a MongoDB

### Test API con Postman — risultati

- ✅ `POST /api/todos` con `title` e `dueDate` → crea todo, `completed: false`, `expired` calcolato correttamente
- ✅ `POST /api/todos` senza `dueDate` → crea todo senza campo data (non incluso nel JSON se undefined)
- ✅ `GET /api/todos` → restituisce solo todo non completati
- ✅ `GET /api/todos?showCompleted=true` → include anche i completati
- ✅ `PATCH /api/todos/:id/check` → imposta `completed: true`, risponde `200`
- ✅ `PATCH /api/todos/:id/uncheck` → imposta `completed: false`, risponde `200`
- ✅ Response pulita: niente `_id`, niente `__v`

### Prossimo step

- Gestione errori nel controller (try/catch con status code corretti)
- Problema aperto: id non esistente o formato non valido restituisce `500` invece di `404` — Mongoose lancia eccezione su ObjectId malformato (`CastError`) che non viene intercettata
- Dopo gestione errori → inizio **frontend Angular**
