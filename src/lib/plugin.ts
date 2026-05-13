import type { MiddlewareFn } from "grammy"
import type { GrullyI18nContext, GrullyI18nFlavor, GrullyI18nInitOptions, GrullyI18nLocalesDict, GrullyI18nOptions, GrullyI18nSessionData, GrullyI18nVars, GrullyMiddleware } from "./types"
import { readdirSync } from "node:fs"
import path, { join } from "node:path"

const LANGUAGE_NAME_LENGTH = 2

/** Factory function that creates the i18n middleware */
export const i18n = <C extends GrullyI18nContext>(
    options: GrullyI18nOptions
): GrullyMiddleware<C> => {
    const {
        defaultLocale,
        folder,
        plugin,
        needCache = true,
        isDebug = false,
        separator = '/'
    } = options

    const {
        init = () => {},
        render,
        compile,
        extension
    } = plugin

    const endFilename = '.' + extension
    const locales: GrullyI18nLocalesDict = {}
    const compileOptions: GrullyI18nInitOptions = {
        isDebug,
        needCache,
        rootFolder: folder
    }
    const availableLanguages: string[] = []

    init(compileOptions)

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
            const key = lastDot !== -1 ? trimmed.slice(0, lastDot) : trimmed

            return key.replaceAll(path.sep, separator)
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
                .filter(v => v.isFile() && v.name.endsWith(endFilename))
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
                    path: fullPath,
                    key
                })
            }

            if(lang.length == LANGUAGE_NAME_LENGTH) {
                availableLanguages.push(lang)
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
                const compileFunction = locales[key]?.[lang] ??
                    locales[key]?.[defaultLocale]
                if (!compileFunction) return dummyText

                return compileFunction(vars)
            }

            else {
                const fullPath = join(folder, lang, key)
                    .replaceAll(separator, path.sep) + endFilename
                return render({
                    ...compileOptions,
                    vars,
                    path: fullPath,
                    key
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

    const i18n: GrullyMiddleware<C>['i18n'] = {
        locales,
        availableLanguages
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
            ...i18n,
            languageCode
        }


        await next()
    }

    const middlewareObj: GrullyMiddleware<C> = {
        middleware: () => middlewareFn,
        i18n
    }

    return middlewareObj
}