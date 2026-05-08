import type { Context, MiddlewareObj } from "grammy"

/** Variables passed to a translation function */
export type GrullyI18nVars = Record<string, any>
/** Dictionary: translation key > locale > compiled function */
export type GrullyI18nLocalesDict = Record<string, Record<string, GrullyI18nCompileFunction>>

export type GrullyI18nCompileOptions = {
    /**
     * Absolute path to the translation file
     */
    path: string,
    isDebug: boolean
    needCache: boolean
}
export type GrullyI18nRenderOptions = GrullyI18nCompileOptions & {
    /**
     * Variables to interpolate
     */
    vars?: GrullyI18nVars
}

export type GrullyI18nTranslateFunction = (key: string, vars?: GrullyI18nVars) => string
export type GrullyI18nCompileFunction = (vars?: GrullyI18nVars) => string

export type GrullyI18nFlavor = {
    /** Translation function attached to the context */
    t: GrullyI18nTranslateFunction
    i18n: {
        /** Dictionary of all loaded locales */
        locales: GrullyI18nLocalesDict
    }
}

/** Expected shape of session data that contains the user's language preference */
export type GrullyI18nSessionData = {
    languageCode: string
}
/** Extended grammy context with i18n capabilities */
export type GrullyI18nContext = Context & GrullyI18nFlavor

export type GrullyI18nOptions = {
    /**
     * Root folder containing locale subdirectories
     */
    folder: string
    /**
     * Fallback language code
     */
    defaultLocale: string
    /**
     * Plugin configuration for customizing how translation files are compiled and rendered. You can use `@grully/i18n-pug` or other
     */
    plugin: GrullyI18nPlugin
    /**
     * @default true
     */
    needCache?: boolean
    /**
     * @default false
     */
    isDebug?: boolean
}

/**
 * Plugin configuration for customizing how translation files are compiled and rendered. You can use `@grully/i18n-pug` or other
 */
export type GrullyI18nPlugin = {
    /** Optional compilation function – returns a function that can be called later with variables */
    compile?: (options: GrullyI18nCompileOptions) => GrullyI18nCompileFunction
    /** Renders a template immediately (used when `needCache` is false or for fallback) */
    render: (options: GrullyI18nRenderOptions) => string
    /** File extension of translation files (e.g., "pug", "html") */
    extension: string
}

export type GrullyMiddleware<C extends GrullyI18nContext> = MiddlewareObj<C> & {
    /** Dictionary of all loaded locales */
    locales: GrullyI18nLocalesDict
}