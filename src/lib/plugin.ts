import type { MiddlewareFn } from "grammy"
import type { GrullyI18nCompileOptions, GrullyI18nContext, GrullyI18nLocalesDict, GrullyI18nOptions, GrullyI18nSessionData, GrullyI18nVars, GrullyMiddleware } from "./types"
import { readdirSync } from "node:fs"
import { join } from "node:path"

/** Factory function that creates the i18n middleware */
export const i18n = <C extends GrullyI18nContext>(
    options: GrullyI18nOptions
): GrullyMiddleware<C> => {
    const {
        defaultLocale,
        folder,
        plugin,
        needCache = true,
        isDebug = false
    } = options

    const {
        render,
        compile = options => vars => render({ ...options, vars }),
        extension
    } = plugin

    const locales: GrullyI18nLocalesDict = {}
    const compileOptions: Omit<GrullyI18nCompileOptions, 'path'> = {
        isDebug,
        needCache,
    }

    if (needCache) {
        const langs = readdirSync(
            folder,
            {
                withFileTypes: true
            }
        )
            .filter(v => v.isDirectory())

        const skipExtension = (skipPathLength: number, fullPath: string) => {
            const startIdx = skipPathLength + 1
            const trimmed = fullPath.slice(startIdx)
            const lastDot = trimmed.lastIndexOf('.')
            const key = lastDot !== -1 ? trimmed.slice(0, lastDot) : ''

            return key
        }

        for (const dir of langs) {
            const lang = dir.name
            const langFolderPath = join(dir.parentPath, lang)

            const skipPath = join(folder, lang)
            const skipPathLength = skipPath.length

            const fullPaths = readdirSync(
                langFolderPath,
                {
                    withFileTypes: true,
                    recursive: true
                }
            )
                .filter(v => v.isFile())
                .map(v => {
                    const path = join(v.parentPath, v.name)
                    return path
                })

            for (const fullPath of fullPaths) {
                const key = skipExtension(
                    skipPathLength,
                    fullPath
                )

                if (!locales[key]) locales[key] = {}

                locales[key][lang] = compile({
                    ...compileOptions,
                    path: fullPath
                })
            }

        }
    }

    type GetTextOptions = {
        lang: string
        vars: GrullyI18nVars
        key: string
    }

    const getText = ({
        lang,
        vars,
        key
    }: GetTextOptions) => {
        const dummyText = `{{ ${key} }}`

        try {
            if (needCache) {
                const compileFunction = locales[key]?.[lang]
                if (!compileFunction) return dummyText

                return compileFunction(vars)
            }

            else {
                const fullPath = join(folder, lang, `${key}.${extension}`)
                return render({
                    ...compileOptions,
                    vars,
                    path: fullPath
                })
            }
        }
        catch (e) {
            if (isDebug) {
                console.error('[grully] ctx.t', e)
            }
            return dummyText
        }
    }

    const middlewareFn: MiddlewareFn<C> = async (ctx, next) => {
        const defaultLanguageCode = ctx.from?.language_code ?? defaultLocale
        const session = (ctx as { session?: GrullyI18nSessionData }).session
        const languageCode = session?.languageCode ?? defaultLanguageCode

        ctx.t = (key, vars = {}) => {
            return getText({
                key,
                vars,
                lang: languageCode
            })
        }

        ctx.i18n = {
            ...ctx.i18n,
            locales
        }


        await next()
    }

    const middlewareObj: GrullyMiddleware<C> = {
        middleware: () => middlewareFn,
        locales
    }

    return middlewareObj
}