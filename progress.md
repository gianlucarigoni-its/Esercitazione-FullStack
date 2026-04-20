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

### Prossimo step
- Aggiungere try/catch al controller con status code corretti
- Implementare `addTodo`, `checkTodo`, `uncheckTodo`
- Collegare tutto in `routes.ts`
- Avviare MongoDB e testare le API
