import {
    dts
} from 'bun-dts'

const buildText = 'Build time'

console.time(buildText)
const result = await Bun.build({
    entrypoints: ["src/lib/index.ts"],
    plugins: [
        dts({
            
        })
    ],
    outdir: 'dist',
    minify: true,
    splitting: true,
    target: 'node',
    external: [
        'grammy'
    ]
})
console.timeEnd(buildText)

const {
    success,
} = result

console.log(`Success: ${success}`)