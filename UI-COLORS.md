# UI colour conventions

## App

The app uses `admin/src/styles/theme.css`. Read [the theme usage guide](admin/src/styles/theme-guide.md) and [token metadata](admin/src/styles/theme.tokens.json) before changing app colours. Use its semantic surface, control, text, icon, border, selection and feedback roles. Choose by purpose even when values currently match.

## Website

The conventions below apply to the separate `web/` application, which retains its own token names.

## Choosing a token

| Purpose | Classes | Examples |
| --- | --- | --- |
| Neutral interactive highlight | `bg-accent text-accent-foreground` | Hovered buttons, highlighted menu options, pressed toggles, file drop targets |
| Subdued surface | `bg-muted` | Skeletons, editor toolbars, keyboard hints, avatar fallbacks, quiet information panels |
| Supporting text | `text-muted-foreground` | Descriptions, placeholders, metadata, secondary icons |
| Main text | `text-foreground` | Labels, entered values, selected values, body text |
| Page or control surface | `bg-background` | Page background, ordinary inputs, unhighlighted controls |
| Card surface | `bg-card text-card-foreground` | Cards and panels |
| Floating surface | `bg-popover text-popover-foreground` | Menus, combobox popups, search headers inside popups |
| Keyboard focus | `border-ring ring-ring` | Focus indicators on buttons, inputs, and other controls |

`muted` does not mean disabled. Disabled controls use their component's existing
disabled styles and behavior.

## Interactive states

Neutral controls use accent colours for hover, keyboard highlighting, expanded
states, and pressed states when those states need a background highlight.
Pair the highlight background with `text-accent-foreground` for the control's
main text or icon. Supporting descriptions may keep `text-muted-foreground`.

```tsx
// Neutral button or clickable area.
className="hover:bg-accent hover:text-accent-foreground"

// Highlighted option in a combobox or menu.
className="data-highlighted:bg-accent data-highlighted:text-accent-foreground"

// File drop target.
className={cn(
  'bg-background hover:bg-accent hover:text-accent-foreground',
  isOver && 'bg-accent text-accent-foreground',
)}
```

Use `text-muted-foreground` on placeholders, then normal foreground text for
entered or selected values. Hover should not dim a control's main text.
Keep keyboard focus indicators; an accent background does not replace them.
An integrated popup search can omit its own ring when the popup handles focus.

## Accent strength

The website defines its accent value in `web/src/styles/globals.css`. Website controls use `bg-accent` across their surfaces. Adjust that shared website token to change its highlight strength.

## Subdued surfaces and supporting text

Use muted backgrounds for passive areas, rather than as a hover colour.
A passive chip background or the track behind tabs can stay muted even though
it contains interactive children.

```tsx
<div className="bg-muted rounded-lg p-3">
  <p className="text-foreground">Image requirements</p>
  <p className="text-muted-foreground">Add up to 10 images.</p>
</div>
```

## Purposeful differences

- Primary and secondary actions keep their own background and foreground pairs,
  including their hover treatments. Checked checkboxes can use the selection
  colour defined by their component.
- Destructive, success, and warning states keep their feedback tokens.
- Sidebar highlights use `sidebar-accent` and `sidebar-accent-foreground`.
- Active tabs may use a raised background or underline instead of an accent fill.
- Image masks, backdrops, and marketing illustrations may need dedicated colours
  or opacity for contrast against their content.

## Where to make changes

- App tokens and usage: `admin/src/styles/theme.css` and `admin/src/styles/theme-guide.md`.
- Website tokens: `web/src/styles/globals.css`.
- Shared control defaults: the relevant `src/components/ui/` component.
- Feature-specific states, such as dragging files: the owning feature component.

Use existing semantic tokens instead of hardcoded greys for ordinary UI.
Opacity modifiers are available for intentional overlays or subdued surfaces;
the default neutral hover uses `bg-accent` at full opacity. Prefer changing a
shared component over repeating overrides in its callers.
