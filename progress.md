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

## 22/04/2026 — Gestione errori + Validazione input backend

### Architettura gestione errori

#### Struttura cartella `src/errors/`

- **`not-found.error.ts`** — classe `NotFoundError extends Error` + `notFoundHandler`
  - `NotFoundError`: errore custom lanciato dal controller quando `todoSrv.check()` / `todoSrv.uncheck()` ritorna `null` (documento non trovato nel DB)
  - `notFoundHandler`: error handler Express (firma 4 parametri) — intercetta solo `instanceof NotFoundError`, risponde `404` con `{ error, message }`, altrimenti chiama `next(err)` per passare al prossimo handler

- **`generic.error.ts`** — `genericErrorHandler`
  - Fallback finale della catena — nessun `if`, nessun `next(err)` — risponde sempre `500` con `{ error, message }`
  - Deve essere **sempre l'ultimo** nell'array degli handler perché non passa mai al successivo

- **`validation-error.ts`** — classe `ValidationError extends Error` + `validationHandler`
  - `ValidationError`: errore custom che wrappa l'array di `OriginalValidationError[]` da `class-validator`
  - Nel costruttore: estrae i messaggi da `error.constraints` (oggetto `{ nomeRegola: messaggio }`) con `Object.values()`, li concatena in una stringa leggibile
  - Conserva `originalErrors` per la response dettagliata
  - `validationHandler`: intercetta solo `instanceof ValidationError`, risponde `400` con `{ error, message, details[] }` dove ogni detail espone `property`, `value`, `constraints`
  - `import type` usato per l'import da `class-validator` — importa solo il tipo TypeScript, zero overhead a runtime

- **`index.ts`** — barrel file che esporta `errorHandlers` array
  - Array corretto (aggiornato durante la sessione):
    ```typescript
    export const errorHandlers = [
      validationHandler,
      notFoundHandler,
      genericErrorHandler,
    ];
    ```
  - **Ordine critico**: handler specifici prima, `genericErrorHandler` sempre per ultimo
  - Bug identificato e corretto: inizialmente `validationHandler` era assente dall'array

#### Flusso errori completo (Express 5)

```
Request → Router → Middleware validate() → Controller → Service
                         ↓ (se errore)
                   next(new ValidationError())
                         ↓
                   app.use(errorHandlers)
                         ↓
                   validationHandler → se non suo: next(err)
                         ↓
                   notFoundHandler → se non suo: next(err)
                         ↓
                   genericErrorHandler → risponde 500
```

#### Concetto appreso — ordine degli error handler

- Gli handler Express vengono eseguiti in sequenza nell'ordine in cui sono registrati
- Ogni handler controlla con `instanceof` se l'errore è di sua competenza
- Se non è di sua competenza: chiama `next(err)` per passare al successivo
- Il `genericErrorHandler` non ha `if` né `next(err)` → è il terminatore della catena → deve stare per ultimo

---

### Validazione input — `class-validator` + `class-transformer`

#### File creato: `src/utils/validation-middleware.ts`

- Middleware factory `validateFn<T>(dtoClass, origin)` — genera un middleware Express a partire da una classe DTO e un'origine (`'body'` | `'query'` | `'params'`)
- **TypeScript overload signatures**: tre firme dichiarate per tipizzare correttamente `req.body`, `req.query`, `req.params` in base all'`origin` passato — a runtime esiste una sola implementazione
- **`plainToClass(dtoClass, req[origin])`** (`class-transformer`): converte il plain object da Express in un'istanza vera della classe DTO — necessario perché `class-validator` funziona solo su istanze di classi, non su plain objects
- **`classValidate(data)`** (`class-validator`): esegue tutti i decorator sull'istanza e ritorna array di `ValidationError[]`
- Se validazione ok: sovrascrive `req[origin]` con l'istanza tipizzata e chiama `next()`
- Se validazione fallisce: chiama `next(new ValidationError(errors))` — entra nella catena error handler
- Fix per Express 5: `Object.defineProperty` su `req.query` per renderlo writable (Express 5 lo rende read-only di default)

#### Integrazione in `todo.router.ts`

```typescript
router.get("/", validate(ShowCompletedDto, "query"), getTodoList);
router.post("/", validate(AddTodoDto, "body"), addTodo);
router.patch("/:id/check", validate(IdParams, "params"), checkTodo);
router.patch("/:id/uncheck", validate(IdParams, "params"), uncheckTodo);
```

- Il middleware `validate()` viene eseguito **prima** del controller — se fallisce, il controller non viene mai raggiunto

---

### DTO aggiornati — `src/api/todo.dto.ts`

#### `IdParams` (`src/utils/id-params.ts`)

```typescript
@IsMongoId()
id: string;
```

- `@IsMongoId()`: valida che la stringa sia un ObjectId MongoDB valido (24 caratteri hex)
- Intercetta id malformati **prima** che arrivino a Mongoose → risponde `400` invece di `500` (CastError)

#### `ShowCompletedDto` — versione finale

```typescript
@IsOptional()
@IsBooleanString()
showCompleted?: string;
```

- `@IsOptional()`: senza questo decorator, `class-validator` tratta il campo come obbligatorio anche se TypeScript lo marca con `?`
- `@IsBooleanString()` preferito a `@IsBoolean() + @Type(() => Boolean)` — motivo: `Boolean("false")` in JavaScript ritorna `true` (qualsiasi stringa non vuota è truthy) → conversione a boolean nativo non sicura per le query string
- Rimane `string` nel tipo → il service mantiene `if (filter.showCompleted !== "true")`
- Il backend non fa assunzioni sul frontend — rispetta il contratto della spec OpenAPI indipendentemente da chi chiama l'API

#### `AddTodoDto` — versione finale

```typescript
@IsString()
@IsNotEmpty()
title: string;

@IsOptional()
@IsDate()
@Type(() => Date)
dueDate?: Date;
```

- `@IsNotEmpty()` aggiunto su `title`: `@IsString()` da solo accetta stringhe vuote `""` — `@IsNotEmpty()` garantisce che il titolo abbia contenuto
- `@IsOptional()` aggiunto su `dueDate`: necessario per non rendere il campo obbligatorio
- `@Type(() => Date)` (`class-transformer`): converte la stringa ISO dal JSON in oggetto `Date` JavaScript **prima** che `@IsDate()` la validi — senza questa conversione `@IsDate()` fallirebbe sempre perché il JSON trasporta le date come stringhe
- La coppia `@Type(() => Date)` + `@IsDate()` è necessaria: il primo converte, il secondo valida — non sono intercambiabili

---

### Concetti appresi

- **`instanceof` negli error handler**: meccanismo per riconoscere il tipo di errore a runtime e rispondere con lo status code corretto — alternativa tipizzata al confronto su `err.name`
- **`Object.values(constraints)`**: `constraints` in `class-validator` è `{ nomeDecorator: messaggioErrore }` — `Object.values()` estrae solo i messaggi
- **`!` non-null assertion operator TypeScript**: dice al compilatore "so che questo valore non è null/undefined" — usato su `error.constraints!` dove siamo certi che esista se la validazione è fallita
- **`import type`**: importa solo la definizione TypeScript, viene eliminato completamente a runtime — utile per evitare dipendenze circolari e ridurre il bundle
- **`Boolean("false") === true`**: in JavaScript qualsiasi stringa non vuota è truthy — `@Type(() => Boolean)` non è adatto per convertire query string booleane
- **Principio**: il backend deve rispettare il contratto della spec API senza fare assunzioni su chi lo chiama (frontend, mobile, Postman, ecc.)
- **DRY negli error handler**: separare gli handler per tipo di errore evita di ripetere la stessa logica `if/else` in ogni controller

---

### Prossimo step

- Inizio **frontend Angular**
- Struttura componenti da definire: lista, item, modal
- Setup proxy `/api` per development
- Installazione e configurazione **ng-bootstrap**

## 23/04/2026 — Frontend Angular avviato + componenti base implementati

### Setup progetto Angular

- Progetto generato con `ng new frontend` dalla root della monorepo — crea una sottocartella autocontenuta con `package.json` e `node_modules` separati dal backend
- Versione Angular: **21.2.0**, TypeScript **5.9.2** — approccio **Standalone Components** (no `NgModule`)
- SSR disabilitato durante `ng new` — non necessario per questo progetto
- Stylesheet format: **CSS**

#### File generati da Angular CLI

- `src/app/app.ts` — componente root, usa `signal` per il titolo
- `src/app/app.config.ts` — configurazione providers dell'app (equivalente moderno di `AppModule`)
- `src/app/app.routes.ts` — router Angular
- `src/main.ts` — bootstrap con `bootstrapApplication(App, appConfig)`

---

### Dipendenze installate

#### `@ng-bootstrap/ng-bootstrap@20.0.0`
- Installato con `ng add @ng-bootstrap/ng-bootstrap` — usa `ng add` invece di `npm install` perché esegue anche uno **schematic**: script automatico che modifica `package.json`, `angular.json`, `main.ts`, `tsconfig.app.json`
- `ng add` aggiunge automaticamente `provideHttpClient()` in `app.config.ts`

#### Bootstrap Icons
- Aggiunto via CDN in `src/index.html` — libreria separata da Bootstrap CSS, non inclusa da `ng add`
- Permette uso delle classi `bi bi-*` nei template HTML

---

### Configurazione

#### Proxy `/api` — `proxy.config.json`
- File creato: `frontend/proxy.config.json`
- Redirige tutte le richieste `/api/**` verso `http://localhost:3000` — evita CORS in sviluppo
- Registrato in `angular.json` sotto `serve.options.proxyConfig`

#### Schematics Angular — `angular.json`
- Aggiunta sezione `schematics` per aggiungere suffisso `.component.` ai file generati:
```json
  "@schematics/angular:component": { "type": "component" }
```
- Motivazione: `ng generate component` genera 4 file per componente — il suffisso rende immediatamente riconoscibile il tipo di file nel file explorer e nei tab di VS Code

---

### Struttura componenti creata

    src/app/
    ├── components/
    │   ├── todo-list/         ← pagina principale
    │   ├── todo-item/         ← singolo elemento (da     popolare)
    │   └── todo-modal/        ← modal creazione (da    separare)
    └── services/
    └── todo.service.ts    ← tutte le chiamate HTTP

- Scelta **opzione B (per feature)** invece di flat — con 4 file per componente, la struttura flat diventerebbe ingestibile
- Componenti generati con `ng generate component` / `ng generate service`

---

### `frontend/src/app/entities/todo.entity.ts` — creato

- Interface `Todo` che rispecchia la response del backend:
```typescript
  id: string
  title: string
  dueDate?: string
  completed: boolean
  expired: boolean
```

---

### `frontend/src/app/services/todo.service.ts` — implementato

- `@Injectable({ providedIn: 'root' })` — registrato nel DI container globale (singleton), disponibile ovunque nell'app senza import nei componenti
- `private http = inject(HttpClient)` — injection moderna senza costruttore
- **Stato interno con Signals:**
  - `private internal = signal<Todo[]>([])` — stato scrivibile privato
  - `todos = this.internal.asReadonly()` — esposto in sola lettura ai componenti — i componenti non possono modificare lo stato direttamente
- **`fetch(showCompleted?: boolean)`** — chiamata GET, due varianti:
  - senza parametro → `GET /api/todos`
  - con `showCompleted=true` → `GET /api/todos?showCompleted=true`
  - Aggiorna `internal` con `.set(items)` alla risposta
  - Chiamato nel constructor per il load iniziale
- **`addTodo(title: string, dueDate: Date | undefined)`** — chiamata POST a `/api/todos`, aggiunge il nuovo todo allo stato con spread: `[...this.internal(), newItem]`
- **`updateTodoStatus(id: string, completed: boolean)`** — chiama `/check` o `/uncheck` in base al booleano, aggiorna il todo corrispondente nell'array con `structuredClone` per immutabilità:
  1. trova l'indice con `findIndex`
  2. clona l'array con `structuredClone`
  3. sostituisce l'elemento
  4. chiama `internal.set(clone)`

---

### `frontend/src/app/components/todo-list/todo-list.component.ts` — implementato

#### Imports nel decoratore `@Component`
- `DatePipe` — pipe Angular per formattare le date nel template
- `NgbInputDatepicker` — componente datepicker di ng-bootstrap
- `FormsModule` — necessario per `ngModel` nel template

#### Stato del componente
- `showCompleted = false` — booleano semplice (non signal, non serve reattività)
- `title = signal<string>('')` — titolo del nuovo todo
- `dueDateInput = signal<NgbDateStruct | null>(null)` — data selezionata dal datepicker, tipo `NgbDateStruct` (oggetto `{ year, month, day }`) perché ng-bootstrap non usa `Date` nativo

#### Metodi implementati
- **`getShowCompleted()`** — toggling con `!this.showCompleted` + chiamata `fetch`
- **`open(content: TemplateRef<any>)`** — apre il modal ng-bootstrap, gestisce `.result.then()`:
  - callback successo → converte la data + chiama `addTodo`
  - callback dismiss → no-op
- **`getDate(dueDate: NgbDateStruct): Date`** — converte `NgbDateStruct` in `Date` JavaScript con `new Date(year, month - 1, day)`. Il `-1` è necessario perché JavaScript conta i mesi da 0 (Gennaio=0) mentre ng-bootstrap conta da 1 (Gennaio=1)

#### Concetti appresi — NgbModal
- `NgbModal` è un servizio che gestisce ciclo di vita dei modal
- `modalService.open(content)` riceve un `TemplateRef` — il blocco `<ng-template #content>` dall'HTML
- `.result` è una Promise: `then(onClose, onDismiss)` — `close()` risolve, `dismiss()` rigetta

---

### `frontend/src/app/components/todo-list/todo-list.component.html` — implementato

#### Toolbar
- Layout con `d-flex justify-content-around align-items-center`
- **Toggle switch** con `form-check form-switch`:
  - `[checked]="showCompleted"` — property binding, sincronizza visivamente la checkbox con lo stato
  - `(change)="getShowCompleted()"` — event binding, aggiorna lo stato al click
  - `form-check-reverse` per label a sinistra del toggle
- **Bottone "Create Todo"** con `(click)="open(content)"`

#### Modal ng-bootstrap (`<ng-template #content let-modal>`)
- `let-modal` — espone l'istanza del modal nel template per chiamare `modal.close()` / `modal.dismiss()`
- Campo **title**: `[value]="title()"` + `(input)="title.set($any($event.target).value)"`
- Campo **dueDate** con `ngbDatepicker`:
  - `[ngModel]="dueDateInput()"` — one-way binding dal signal al datepicker
  - `(ngModelChange)="dueDateInput.set($event)"` — aggiorna il signal quando l'utente seleziona una data
  - `name="dueDate"` — obbligatorio quando `ngModel` è dentro un tag `<form>` (altrimenti errore `NG01352`)
  - `#dp="ngbDatepicker"` — reference locale per chiamare `dp.toggle()` dal bottone calendario
- Footer con bottone **Cancel** (`modal.dismiss()`) e **Create** (`modal.close()`)

#### Lista todo
- `<div class="list-group">` fuori dal `@for` — un solo contenitore, non uno per elemento
- `@for (todo of todoList(); track todo.id)` — loop su signal readonly
- Classi contestuali Bootstrap:
  - `[class.list-group-item-success]="todo.completed"` → sfondo verde
  - `[class.list-group-item-danger]="todo.expired"` → sfondo rosso
- `@if (todo.dueDate !== undefined)` — mostra la data solo se presente
- `{{ todo.dueDate | date: 'mediumDate' }}` — pipe `DatePipe` per formattare la data

---

### Concetti appresi

- **Standalone Components**: no `NgModule` — ogni componente dichiara i propri `imports` nel decoratore. I provider globali si registrano in `app.config.ts` con funzioni `provide*()`
- **`provideHttpClient()`**: registra `HttpClient` nel DI container — senza questo, qualsiasi inject di `HttpClient` lancia errore a runtime
- **`providedIn: 'root'`**: il service viene istanziato una volta sola (singleton) e condiviso in tutta l'app — non serve importarlo nei componenti
- **`signal.asReadonly()`**: espone un signal in sola lettura — i consumer possono leggere ma non scrivere. Pattern per proteggere lo stato interno di un service
- **`structuredClone()`**: copia profonda di un oggetto/array — garantisce immutabilità aggiornando lo stato senza mutare l'array originale
- **`[property]` vs `(event)`**: due direzioni del data flow in Angular — `[checked]` va da TS al DOM (one-way in), `(change)` va dal DOM a TS (one-way out)
- **`$event` negli event handler**: oggetto evento nativo del browser — `$event.target.value` per leggere il valore di un input
- **`NgbDateStruct`**: tipo ng-bootstrap per le date `{ year, month, day }` — i mesi partono da 1, non da 0 come in JavaScript nativo → necessario `month - 1` nella conversione
- **`TemplateRef`**: riferimento a un blocco `<ng-template>` — si passa a `NgbModal.open()` per renderizzare il contenuto del modal
- **`ngModel` dentro `<form>`**: richiede attributo `name` sul campo oppure `[ngModelOptions]="{standalone: true}"` — senza, Angular lancia errore `NG01352`
- **`ng add` vs `npm install`**: `ng add` scarica il pacchetto + esegue schematic di configurazione automatica; `npm install` scarica solo il pacchetto
- **Block-level elements e `width: auto`**: un `div` è block-level per default — `width: auto` si espande alla larghezza del contenitore, non del contenuto. Per restringersi al contenuto: `d-inline-block` o `d-inline-flex`
- **`!` non-null assertion operator**: dice a TypeScript "so che questo valore non è null" — usato dopo un controllo esplicito `!== null`

---

### Prossimo step

- Implementare `todo-item` component (estrarre il singolo elemento dalla lista)
- Implementare toggle completamento (checkbox per ogni todo → `updateTodoStatus`)
- Separare il modal in `todo-modal` component
- Testare il flusso completo end-to-end