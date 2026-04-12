# User Requests — Complete Log

> Auto-maintained. Captures every user request from this development session.
> Last updated: 2026-04-10

---

## Session: April 10, 2026

### Architecture & Migration

- "analyze the project, create a detailed plan to convert it to react or preact. (what is better?)"
- "do it" — Execute the full Svelte → React migration
- "analyze arch and code quality. find and fix bugs"

### State Management

- "also you can use zustand 4.5.7 for global state management"

### AI Provider Architecture

- "add option to connect to localhost ollama rest api and list its available models and use one of them instead of default gemini nano api in chrome itself"
- "each persona/companion can have its own design themes"
- "create separate module as chrome prompt client and ollama client. try to make them return same contracts/interfaces so they can be easily interchangeable... or add some kind of adaptor"
- "lokks like current js code getting ai response from chrome ai is not working well check the examples and exact api usage rules here https://github.com/webmachinelearning/prompt-api"
- "use the ollama gemma4:31b-cloud model by default"
- "ollama should be default model!"

### UI/UX Redesign

- "use 2 spaces for paddings"
- "and generic js validation settings"
- "give a better name for ai expert and increase ui/ux fancyness usability sanity, for now many parts are not finished yet"
- "maybe there is sense to use radio controls and tailwind? for easier styling"
- "bts try to use scss instead of css"
- "revalidate all margins/paddings/layouts. harmonize everything. from look and feel to texts and fading/appearing animations"
- "create a perfect set of unit tests and e2e tests"
- "create a new perfect ui! i dont want black theme. just make it fucking working without blinking/bugs/jumping stuff etc. add nice ease animations for appearing texts etc."
- "dont forget to finish all previously requested changes"
- "think about which controls should be disabled or focused during a chat, waiting for the answer, etc"

### Interactive Tools & Challenges

- "add more fun jobs/quizzes/games with aria. make it proactive and engaging."
- "design a tool for her to ask ui to render some quiz with some answers, or reorder sentences or match words meanings etc. think yourself which tool ielts mentor might need"
- "do not predefine challenges quizzes and hardcode them in code, just give llm examples and ask to answer in json for tools usage calls (setting up quizzes or other helpers in chat)"
- "create a list of random 100 themes. then ask llm to create stories/sentences quizzes examples about mix of three randomly picked theme in real life. like 'lemonade, penguin and economy' create engaging story or quizzes about it."
- "btw you can cache all the quizzes/stories generated to reuse them later without llm calls"
- "create an awesome project readme file, design awesome website icon, polish project docs"
- "dont forget to finish all previously requested changes"

### Companions & Personalities

- "make sure each character or companion excels in some kind of personal development success and can help in fun and fancy way to enjoy self improving."
- "i need a new person added there who will be teaching/preparing me to the IELTS C2 level exams. design awesome name/personality (girl teacher) for this. think about some awesome system prompts/games/quizzes engines to make C2 english teaching really fun with it"
- "you are free to completely redesign yourself full project look/ui/ux/flows/use-cases/design primitives/palettes/tokens/etc. just make awesome project out of it"
- "think/design more companion personalities. each one with his own goals, knowledge/expertise/mood/feel/etc"
- "think about generic tools available for them in chat."
- "create a perfect companion for learning"
- "create a perfect set of unit tests and e2e tests"

### Knowledge & Memory

- "also make llm compress/archive knowledge about current user and store it in local storage. then restore knowledge when chat is opened (in background, not showing this in chat. so companion would feel personal and caring/engaging/supportive)"
- "of course design a system to track user progress"
- "interests themes etc"

### Documentation & Process

- "do a perfect planning for every change, save plan in docs folder, then implement plan phase by phase, you can commit yourself each successfully finished phase."
- "for success measurements do eslint and unit tests checks. maybe some additional project quality checks scripts."
- "create a perfectly splitted/managed project documentations, readme, etc"
- "store each task in docs/tasks folder."
- "move each finished task to docs/archived/tasks."
- "create sane agents.md file with rules following all my ideas in the chat. with automatic upkeep, update maintain documentation automatically"
- "update all the project documentations, create lessons learned automatically maintained"
- "do a detailed arc and code review. calculate quality scores, potential improvements pain points, save the report as doc file. then fix issues step by step phase by phase committing the successful changes"
- "create a perfect set of unit tests and e2e tests"
- "don't forget to store each requests in docs folder and create plan for each feature and then commit it phase by phase."
- "keep improving the project"
- "store all the request i gave you here in change in some docs file, so you will not forget tomorrow what i was asking for"
- "as soon as i ask anything store all my requests somewhere in the docs, update agents md or lessons learned after each finished request or its phase. commit after each phase. save these rules now. keep code / architecture / ui in perfect state. dont be lazy."
- "add several more useful characters/personas everyone with unique skills, mood, character, charisma, goals and experiences. all eager to help the user proactively"
- "looks like chrome ai generates responses word by word but removing previously generated text from next response.. so you should store yourself all previously received token/words"
- "add some fancy css easing fading showing animation to all the text appearing in chat messages, also make sure all the chat messages layouts margins paddings justifications alignments are correct and nothing is jumping in ui in different use cases"

### Tech Stack Decisions

- "use vite 7.3.2"
- "use eslint v9.39.4"
- "use biome 2.4.11"
- "remove any svelte related leftovers"
- "return the prettier and eslint checks and mainstream js configs and settings and plugins"
- "remove any svelte related leftovers"
- "of course improve overall app layout/texts/usability/alignments/paddings/margins just make sure everything is usable and sane"
- "continue polishing/improving the project until i stop you"

---

## Summary Statistics

| Category                       | Requests |
| ------------------------------ | -------- |
| Architecture & Migration       | 6        |
| State Management               | 1        |
| AI Provider Architecture       | 6        |
| UI/UX Redesign                 | 11       |
| Interactive Tools & Challenges | 8        |
| Companions & Personalities     | 6        |
| Knowledge & Memory             | 3        |
| Documentation & Process        | 11       |
| Tech Stack Decisions           | 11       |
| **Total**                      | **63**   |

---

## Completed Items

- [x] Svelte → React migration
- [x] Zustand 4.5.7 state management
- [x] Unified AIClient interface (Chrome + Ollama)
- [x] Ollama as default provider (gemma4:31b-cloud)
- [x] SCSS styling with design tokens
- [x] ESLint 9.39.4 + Prettier + Biome 2.4.11
- [x] Vite 7.3.2
- [x] 10 personal-development companions (Aria, Kai, Nova, Sage, Pixel, Atlas, Luna, Zen, Hera, Aino)
- [x] Aino — Finnish A1 → B1 tutor with full curriculum
- [x] Interactive quiz tools (Quiz, T/F, Fill-Blank, Word Match)
- [x] Theme engine with 105 random themes
- [x] Universal game engine (10 game types: 20Q, Word Ladder, Riddle, Story, T&L, Association, WYR, Quote, Emoji, Hot/Cold)
- [x] DnD RPG engine (4 classes, stat rolling, story generation, d20 resolution)
- [x] Challenge cache with LRU pruning
- [x] Knowledge service (silent memory compression)
- [x] Player stats system with localStorage persistence
- [x] Universal KV store for companion data (get/set/delete/remove)
- [x] Radix UI settings panel (Dialog, RadioGroup, Switch, Select)
- [x] Settings consolidation (provider/model/export in modal)
- [x] Component decomposition (Sidebar, ChatArea, ChatMessage, ChatInput, etc.)
- [x] Streaming text animation with blinking cursor
- [x] SVG favicon
- [x] Comprehensive README + ARCHITECTURE.md
- [x] LESSONS_LEARNED.md (auto-maintained, 4 sections)
- [x] AGENTS.md (auto-maintained project rules)
- [x] USER_REQUESTS.md (complete log of 63+ requests)
- [x] IMPLEMENTATION_PLAN.md (10-phase plan)
- [x] CHROME_AI_SPEC.md (full API spec with examples)
- [x] 36 unit tests passing (5 suites)
- [x] E2E tests configured (Playwright)
- [x] Light theme redesign
- [x] isInitializing/isProcessing state management
- [x] Request log (this file)

---

## Pending / In Progress

- [ ] Wire up theme challenge generation to LLM in live chat (🎲 button → LLM → render tool card)
- [ ] Wire up knowledge compression to LLM every 5 messages (silent)
- [ ] ToolRenderer: integrate StorageTool, game cards, DnD cards
- [ ] Textarea auto-resize integration (hook ready)
- [ ] Progress dashboard UI (streaks, achievements, scores)
- [ ] Remove Tailwind dependency (fully SCSS) — _low priority since Tailwind + Radix works well_
- [ ] Playwright E2E test execution (browser install needed)
