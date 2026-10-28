# restyle-museum-v1 — PELEH Museum Shop in the books-app look (draft, not published)
- site/        restyled copy of ../shop/site (live files untouched; verified with diff against before-site/)
- before/ after/  390×844 @2x renders (headless Chrome via tools/render.js, same states as the original previews)
- compare-*.png   side-by-side before/after; compare-all.png = all four stacked
Re-render: cd tools && node render.js ../site ../after
