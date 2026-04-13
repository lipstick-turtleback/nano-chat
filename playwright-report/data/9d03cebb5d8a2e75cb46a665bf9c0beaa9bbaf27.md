# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.js >> character count updates as user types
- Location: e2e/app.spec.js:56:1

# Error details

```
TypeError: page.locator(...).toBeVisible is not a function
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - heading "Companions" [level=2] [ref=e5]
    - group "Select AI companion" [ref=e6]:
      - generic [ref=e7] [cursor=pointer]:
        - radio "Aria C2 English Mastery" [disabled] [ref=e8]
        - generic [ref=e9]: 🎓
        - generic [ref=e10]:
          - generic [ref=e11]: Aria
          - generic [ref=e12]: C2 English Mastery
      - generic [ref=e13] [cursor=pointer]:
        - radio "Kai Mindfulness & Emotional Growth" [disabled] [ref=e14]
        - generic [ref=e15]: 🧘
        - generic [ref=e16]:
          - generic [ref=e17]: Kai
          - generic [ref=e18]: Mindfulness & Emotional Growth
      - generic [ref=e19] [cursor=pointer]:
        - radio "Nova Body & Energy Coach" [disabled] [ref=e20]
        - generic [ref=e21]: ⚡
        - generic [ref=e22]:
          - generic [ref=e23]: Nova
          - generic [ref=e24]: Body & Energy Coach
      - generic [ref=e25] [cursor=pointer]:
        - radio "Sage Critical Thinking & Wisdom" [disabled] [ref=e26]
        - generic [ref=e27]: 🔮
        - generic [ref=e28]:
          - generic [ref=e29]: Sage
          - generic [ref=e30]: Critical Thinking & Wisdom
      - generic [ref=e31] [cursor=pointer]:
        - radio "Pixel Design & Creative Skills" [disabled] [ref=e32]
        - generic [ref=e33]: 🎨
        - generic [ref=e34]:
          - generic [ref=e35]: Pixel
          - generic [ref=e36]: Design & Creative Skills
      - generic [ref=e37] [cursor=pointer]:
        - radio "Atlas Career & Life Strategy" [disabled] [ref=e38]
        - generic [ref=e39]: 🗺️
        - generic [ref=e40]:
          - generic [ref=e41]: Atlas
          - generic [ref=e42]: Career & Life Strategy
      - generic [ref=e43] [cursor=pointer]:
        - radio "Luna Writing & Creative Expression" [disabled] [ref=e44]
        - generic [ref=e45]: 🌙
        - generic [ref=e46]:
          - generic [ref=e47]: Luna
          - generic [ref=e48]: Writing & Creative Expression
      - generic [ref=e49] [cursor=pointer]:
        - radio "Zen Programming & Tech Skills" [disabled] [ref=e50]
        - generic [ref=e51]: 💻
        - generic [ref=e52]:
          - generic [ref=e53]: Zen
          - generic [ref=e54]: Programming & Tech Skills
      - generic [ref=e55] [cursor=pointer]:
        - radio "Hera Communication & Leadership" [disabled] [ref=e56]
        - generic [ref=e57]: 👑
        - generic [ref=e58]:
          - generic [ref=e59]: Hera
          - generic [ref=e60]: Communication & Leadership
      - generic [ref=e61] [cursor=pointer]:
        - radio "Aino Finnish A1 → B1 Tutor" [disabled] [ref=e62]
        - generic [ref=e63]: 🇫🇮
        - generic [ref=e64]:
          - generic [ref=e65]: Aino
          - generic [ref=e66]: Finnish A1 → B1 Tutor
      - generic [ref=e67] [cursor=pointer]:
        - radio "Mira DnD & Interactive Adventures" [checked] [disabled] [ref=e68]
        - generic [ref=e69]: 🎲
        - generic [ref=e70]:
          - generic [ref=e71]: Mira
          - generic [ref=e72]: DnD & Interactive Adventures
  - main [ref=e73]:
    - generic [ref=e74]:
      - generic [ref=e77]: Ollama · gemma4:31b-cloud
      - button "Open settings" [ref=e78] [cursor=pointer]:
        - img [ref=e79]
    - generic "Chat messages" [ref=e82]:
      - generic [ref=e84]:
        - paragraph [ref=e86]: The campaign remembers you. Where shall we go?
        - generic [ref=e88]: 7:52:00 PM
      - generic [ref=e90]:
        - generic [ref=e91]:
          - generic [ref=e92]: 🎲
          - generic [ref=e93]: Mira the Game Master
        - generic [ref=e99]: 7:52:00 PM
    - generic [ref=e101]:
      - textbox "Chat message input" [ref=e102]:
        - /placeholder: Waiting for response...
      - generic [ref=e103]:
        - generic [ref=e104]: "0"
        - button "Cancel request" [ref=e105] [cursor=pointer]:
          - img [ref=e106]
  - complementary [ref=e108]:
    - button "🎲 Surprise Me" [disabled] [ref=e109]
    - button "📊 View Progress Dashboard" [ref=e110] [cursor=pointer]
    - generic [ref=e111]:
      - generic [ref=e112]:
        - heading "📊 Progress" [level=3] [ref=e113]
        - generic [ref=e114]:
          - generic [ref=e115]:
            - generic [ref=e116]: Sessions
            - generic [ref=e117]: "0"
          - generic [ref=e118]:
            - generic [ref=e119]: Streak
            - generic [ref=e120]: —
          - generic [ref=e121]:
            - generic [ref=e122]: Messages
            - generic [ref=e123]: "0"
          - generic [ref=e124]:
            - generic [ref=e125]: Level
            - generic [ref=e126]: beginner
      - generic [ref=e127]:
        - generic [ref=e128]:
          - generic [ref=e129]: ⚔️
          - generic [ref=e130]:
            - generic [ref=e131]: Adventurer
            - generic [ref=e132]: Fighter · Level 1
        - generic [ref=e133]:
          - generic [ref=e134]: HP
          - generic [ref=e137]: 14/14
        - generic [ref=e138]:
          - generic [ref=e139]: XP
          - generic [ref=e141]: 0/300
        - generic [ref=e142]:
          - generic [ref=e143]:
            - generic [ref=e144]: AC
            - generic [ref=e145]: "18"
          - generic [ref=e146]:
            - generic [ref=e147]: Speed
            - generic [ref=e148]: "30"
          - generic [ref=e149]:
            - generic [ref=e150]: Init
            - generic [ref=e151]: "+2"
          - generic [ref=e152]:
            - generic [ref=e153]: Gold
            - generic [ref=e154]: 💰 29
          - generic [ref=e155]:
            - generic [ref=e156]: ✨ Insp
            - generic [ref=e157]: "3"
        - generic [ref=e158]:
          - 'generic "strength: 10" [ref=e159]':
            - generic [ref=e160]: STR
            - generic [ref=e161]: "10"
            - generic [ref=e162]: "+0"
          - 'generic "dexterity: 15" [ref=e163]':
            - generic [ref=e164]: DEX
            - generic [ref=e165]: "15"
            - generic [ref=e166]: "+2"
          - 'generic "constitution: 11" [ref=e167]':
            - generic [ref=e168]: CON
            - generic [ref=e169]: "11"
            - generic [ref=e170]: "+0"
          - 'generic "intelligence: 15" [ref=e171]':
            - generic [ref=e172]: INT
            - generic [ref=e173]: "15"
            - generic [ref=e174]: "+2"
          - 'generic "wisdom: 13" [ref=e175]':
            - generic [ref=e176]: WIS
            - generic [ref=e177]: "13"
            - generic [ref=e178]: "+1"
          - 'generic "charisma: 16" [ref=e179]':
            - generic [ref=e180]: CHA
            - generic [ref=e181]: "16"
            - generic [ref=e182]: "+3"
        - generic [ref=e183]:
          - text: 🎒 Items
          - generic [ref=e184]:
            - generic "Longsword" [ref=e185]
            - generic "Health Potion" [ref=e186]: Health Potion (1)
            - generic "Torch" [ref=e187]: Torch (3)
            - generic "Adventurer's Pack" [ref=e188]
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('app loads and shows chat interface', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page.getByText('Companions')).toBeVisible({ timeout: 10000 });
  6  | });
  7  | 
  8  | test('sidebar shows all companions', async ({ page }) => {
  9  |   await page.goto('/');
  10 |   await expect(page.locator('.sidebar')).toBeVisible({ timeout: 10000 });
  11 | 
  12 |   // Check key companions are listed
  13 |   await expect(page.getByText('Aria')).toBeVisible();
  14 |   await expect(page.getByText('Kai')).toBeVisible();
  15 |   await expect(page.getByText('Mira')).toBeVisible();
  16 | });
  17 | 
  18 | test('settings button is visible in header', async ({ page }) => {
  19 |   await page.goto('/');
  20 |   await expect(page.locator('.chat-header')).toBeVisible({ timeout: 10000 });
  21 |   // Settings gear icon should be present
  22 |   const header = page.locator('.chat-header');
  23 |   await expect(header).toBeVisible();
  24 | });
  25 | 
  26 | test('chat input is visible and interactive', async ({ page }) => {
  27 |   await page.goto('/');
  28 |   const textarea = page.getByRole('textbox', { name: /chat message input/i });
  29 |   await expect(textarea).toBeVisible({ timeout: 10000 });
  30 |   await expect(textarea).toBeEnabled();
  31 | });
  32 | 
  33 | test('selecting a different companion switches context', async ({ page }) => {
  34 |   await page.goto('/');
  35 |   await page.locator('.sidebar').waitFor({ state: 'visible', timeout: 10000 });
  36 | 
  37 |   // Click on Kai companion radio
  38 |   await page.getByRole('radio', { name: /^kai$/i }).first().click();
  39 | 
  40 |   // Chat should reinitialize
  41 |   await expect(page.getByText('Kai')).toBeVisible();
  42 | });
  43 | 
  44 | test('send button is disabled when input is empty', async ({ page }) => {
  45 |   await page.goto('/');
  46 |   await page.locator('.sidebar').waitFor({ state: 'visible', timeout: 10000 });
  47 | 
  48 |   const sendBtn = page.getByRole('button', { name: /send message/i });
  49 |   await expect(sendBtn).toBeDisabled();
  50 | 
  51 |   const textarea = page.getByRole('textbox', { name: /chat message input/i });
  52 |   await textarea.fill('Hello');
  53 |   await expect(sendBtn).toBeEnabled();
  54 | });
  55 | 
  56 | test('character count updates as user types', async ({ page }) => {
  57 |   await page.goto('/');
> 58 |   await page.locator('.sidebar').toBeVisible({ timeout: 10000 });
     |                                  ^ TypeError: page.locator(...).toBeVisible is not a function
  59 | 
  60 |   const textarea = page.getByRole('textbox', { name: /chat message input/i });
  61 |   await textarea.fill('Hi');
  62 |   await expect(page.locator('.char-count')).toHaveText('2');
  63 | 
  64 |   await textarea.fill('Hello world');
  65 |   await expect(page.locator('.char-count')).toHaveText('11');
  66 | });
  67 | 
```