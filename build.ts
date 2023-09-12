// @ts-ignore
await Bun.build({
    entrypoints: ['./server.ts'],
    outdir: './dist',
    target: "bun",
})

console.log("Build Complete!")