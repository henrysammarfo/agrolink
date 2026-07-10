> [!IMPORTANT]
> Avoid rewriting published git history on `main` — no force-push, rebase, amend, or squash of commits already pushed. Other collaborators and deploy hooks depend on a linear history.

- Keep `main` deployable; run `npm run build` before merging.
- Feature branches: `cursor/<description>-cc54` for agent work.
