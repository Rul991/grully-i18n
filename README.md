# @grully/i18n

**@grully/i18n** is a lightweight internationalization (i18n) plugin for [grammY](https://grammy.dev/) Telegram bot framework.  

It provides a simple `ctx.t()` translation function, supports **file-based translations**, **optional pre‑compilation caching**, and a **pluggable renderer** (e.g., for plain text, Pug, Markdown, or any custom template format).


## Features

- 📁 File‑based translations – each locale is a subfolder, each translation key is a file.
- 🔌 Pluggable renderer – bring your own parser/template engine (Pug, HTML, Markdown, etc.).
- 🌐 Automatic locale detection – uses `ctx.session.languageCode` (if available) > `ctx.from.language_code` > your default locale.
- 🧩 Full TypeScript support – includes typed context flavor and middleware.


## Installation

```bash
npm install @grully/i18n
```

## Example

```typescript
import { env } from "bun"
import { Bot, session, type Context, type SessionFlavor } from "grammy"
import i18n, { type GrullyI18nFlavor, type GrullyI18nSessionData } from '@grully/i18n'
import i18nPug from '@grully/i18n-pug'

type BotContext = Context & GrullyI18nFlavor & SessionFlavor<GrullyI18nSessionData>
type MyBot = Bot<BotContext>

const TOKEN = env.TOKEN!

const bot: MyBot = new Bot(
    TOKEN
)

bot.use(session({
    initial: () => {
        return {
            languageCode: 'en'
        }
    }
}))
bot.use(i18n({
    folder: 'locales',
    defaultLocale: 'en',
    plugin: i18nPug()
}))

bot.command(
    'start',
    async ctx => {
        const result = ctx.t(
            'start/start',
            {
                name: ctx.from?.first_name
            }
        )

        await ctx.reply(result)
    }
)

bot.command(
    'locales',
    async ctx => {
        const result = ctx.t(
            'locales',
            {
                locales: ctx.i18n.locales
            }
        )

        await ctx.reply(result)
    }
)

bot.command(
    'set_lang',
    async ctx => {
        const key = ctx.match
        const lang = key ?? 'ru'

        ctx.session.languageCode = lang
        await ctx.reply(ctx.t('set_lang', { lang: lang }))
    }
)

bot.api.config.use(
    async (prev, method, payload, abort) => {
        return prev(
            method,
            {
                ...payload,
                parse_mode: 'HTML'
            },
            abort
        )
    }
)

bot.start({
    onStart: info => {
        console.log(info)
    }
})
```