# Public UI visual correction

Review proposal based on feat/public-api. No deployment. The deployed checker repeats rounded panels and misses the DOVV reference's changes of scale and section composition.

Keep Pika's cream, blue, navy, Fredoka, Inter and mascot. Introduce a centred oversized statement, open comparison gallery, full-width navy process chapter, editorial findings index and divided FAQ rows. Preserve checker, consent, previews and export behaviour. No new model claims or domain extraction. Review desktop and mobile before merging into feat/public-api. Main remains unchanged.

## Validation

- Inspected the live deployment and DOVV in the browser before editing.
- Reviewed the local hero, findings and process sections; inspected 390px and 320px visual-only iframe layouts.
- Loaded the existing One section sample and ran the local free checker: 15 findings returned in 743ms, with sandboxed preview and finding labels visible.
- Confirmed unique HTML IDs and that all JavaScript ID hooks still resolve. JavaScript syntax and git diff whitespace checks passed.
- No model call made, no production deployment, and no claim of full responsive or accessibility certification. Root Next.js verification was not run: these changes target the separate static API frontend and do not modify the Next.js app.
