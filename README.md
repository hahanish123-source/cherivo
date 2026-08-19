# Hanora

Hanora is a place to create beautiful personal moments and share them through private links.

## Run locally

Open this folder directly in VS Code. `package.json` must be in the folder you open.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` and `http://localhost:3000/create`.

## Creator controls

The creator now exposes the design system on every selected story page:

- Edit button on the live preview. Clicking it exits preview-only mode and opens the editor for that page.
- Section title, subtitle, heading and message editing.
- Separate font selectors for section title, subtitle, heading and message.
- Heading/body size, line height and letter spacing.
- Heading, subtitle, message and emoji/icon colours.
- Per-page card radius, card colour and card opacity.
- Photo upload, photo opacity and remove/replace.
- Five themes: Dark, Light, System default, Romantic, Dreamy.
- Theme colour overrides.
- Background modes: Aurora, Liquid mesh, Starfield, Floating petals, Gradient and Minimal glow.
- Four editable background colours plus base colour, so Aurora/mesh/gradient/minimal palettes can be changed instead of being fixed presets.
- Background photo upload, opacity and a visible Remove background photo button.
- Background overlay control for photo readability.
- Gallery layouts for memory/photo pages.
- Motion presets.
- Optional music upload and removal.

## Assets

Put reusable, non-private assets in `public/assets/`. See `public/assets/README.md`.

Do not put customer private photos or audio in `public/assets/` in production. Those belong in private object storage with access-controlled URLs.

## Production hosting

1. Run `npm install`.
2. Run `npm run build` and fix any local build errors.
3. Push the project root to GitHub.
4. Import the repository into Vercel.
5. Configure Supabase environment variables for private greeting publishing.
6. Use private object storage for customer photos/audio before launching to real users.


## Memory collage update
- Memory/Gallery sections support up to 20 photos.
- Photos are client-side compressed before being stored in the draft to keep greetings lighter.
- Collage presets: Auto collage, Clean grid, Masonry wall, Polaroid pile, Film strip, Scattered memories, Hero photo.
- Individual photos can be removed after selection.
- The recipient view renders the same collage layout from the published project.
- Publishing still has a project-size guard. For production-scale media, use object storage such as Supabase Storage rather than putting large media directly into JSON.


## V10 Scattered Snap
Scattered Memories is centered and interactive. Tapping a photo triggers a snap/dust disappearance rather than opening a lightbox. A restore control can bring the memories back. Hero/page photos also have an explicit choose/replace/remove control.

## V11 private link publishing

### Local testing
Private link generation now works in development without Supabase. The app stores test greetings in `.cherivo-local/greetings.json` (ignored by Git).

Run:
```bash
npm install
npm run dev
```
Create a greeting, click **Create private link**, then click **Open greeting**. The generated `/g/<random-token>` link works in the same local app.

### Production hosting
For Vercel/production, use Supabase. Add these Vercel Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optionally `NEXT_PUBLIC_SITE_URL`

Then run the SQL in `supabase/schema.sql` once in Supabase SQL Editor and redeploy.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or `NEXT_PUBLIC_` variables.
