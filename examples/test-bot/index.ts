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

bot.use(session())
bot.use(i18n({
    folder: 'locales',
    defaultLocale: 'en',
    plugin: i18nPug()
}))

bot.command(
    'key',
    async ctx => {
        const key = ctx.match
        const result = key ?
            ctx.t(key) :
            ctx.t('default/no_key', { command: 'key' })

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