```markdown
# Design System Document: The Cinematic Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

Unlike generic booking platforms that feel like utilitarian databases, this system treats film as high art. We are moving away from "app-like" interfaces toward a **High-End Editorial** experience. The goal is to evoke the feeling of a premium film festival or a private screening room. 

We break the "template" look through **Intentional Asymmetry** and **Tonal Depth**. By utilizing wide gutters, oversized display typography, and overlapping elements (e.g., a movie title bleeding over the edge of a high-resolution still), we create an immersive environment that prioritizes the visual "weight" of cinema. This is not just a shop; it is a gateway to a story.

---

## 2. Colors & Surface Philosophy

### Color Palette (Material Design Convention)
*   **Background:** `#0b1326` (Deep Navy)
*   **Primary (Cinema Red):** `#ffb4aa` (Text/Icon) | `#e50914` (Container)
*   **Secondary (Electric Gold):** `#fff9ef` | `#ffdb3c` (Container)
*   **Surface Tiers:** From `surface_container_lowest` (`#060e20`) to `surface_container_highest` (`#2d3449`).

### The "No-Line" Rule
To maintain a cinematic feel, **1px solid borders are strictly prohibited** for sectioning. Boundaries must be defined solely through background color shifts or subtle tonal transitions. 
*   *Implementation:* Place a `surface_container_low` section atop a `surface` background to create a logical break. Use `surface_bright` only for highlights.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of stacked, fine-grain paper. 
*   **The Hero Layer:** Always sits on `surface`.
*   **The Content Layer:** Cards or lists should use `surface_container_low`.
*   **The Focused Layer:** Interactive elements (modals, dropdowns) use `surface_container_highest`.

### The "Glass & Gradient" Rule
Flat colors are too "software." To provide "visual soul":
*   **Glassmorphism:** For floating navigations or ticket summaries, use semi-transparent surface colors (`#171f33` at 70% opacity) with a `backdrop-blur` of 12px–20px.
*   **Signature Gradients:** Main CTAs should transition from `primary_container` (`#e50914`) to a deeper `on_primary_fixed_variant` (`#930007`) at a 135-degree angle to provide tactile depth.

---

## 3. Typography: Editorial Authority

We use a high-contrast pairing to balance cinematic drama with administrative precision.

*   **Display & Headlines (Epilogue):** This is our "Voice." Use `display-lg` (3.5rem) for movie titles with tight letter-spacing (-0.02em). It conveys authority and premium curation.
*   **Body & Labels (Inter):** This is our "Engine." Inter provides maximum legibility for data-heavy booking flows and admin tables.
*   **Hierarchy Note:** Use `title-lg` for section headers, but keep them in `on_surface_variant` (`#e9bcb6`) to ensure the movie content (Primary/On-Surface) remains the focal point.

---

## 4. Elevation & Depth: Tonal Layering

Traditional shadows are often too "muddy." We achieve hierarchy through **The Layering Principle**.

*   **Tonal Lift:** Instead of a shadow, place a `surface_container_lowest` card on a `surface-container-low` section. This creates a "recessed" look that feels integrated into the interface.
*   **Ambient Shadows:** For floating "Book Now" bars, use a shadow with a blur of 40px and 6% opacity. The shadow color must be a dark navy tint (derived from `surface_dim`), never pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use `outline_variant` at **15% opacity**. This creates a suggestion of a container without breaking the seamless aesthetic.

---

## 5. Components

### Movie Cards
*   **Style:** No borders. Use a `large` roundedness (`0.5rem`).
*   **Layout:** High-ratio vertical imagery with a subtle `surface_container` gradient overlay at the bottom to house the title in `title-sm`. 
*   **Interaction:** On hover, the card should scale (1.02x) and the gradient should deepen, rather than showing a border.

### Interactive Seat Map
*   **Canvas:** `surface_container_lowest`.
*   **Seats:** Use `secondary_fixed_dim` for available seats and `primary_container` for selected.
*   **The Screen:** A wide, subtle arc using a glow gradient (`primary` at 20% opacity) to orient the user without using harsh lines.

### Admin Data Tables
*   **Structure:** Forbid divider lines. Use alternating row colors: `surface_container_low` and `surface_container`.
*   **Typography:** Use `body-sm` (Inter) for high data density.
*   **Status Indicators:** Use functional status colors (`error` for cancelled, `secondary_container` for pending) as small, high-saturation "pills" with `full` roundedness.

### Buttons
*   **Primary:** `primary_container` background with `on_primary_container` text. `xl` roundedness (0.75rem).
*   **Secondary:** `surface_container_highest` background with a "Ghost Border."
*   **Tertiary:** No background. Bold `primary` text. Use for "View Details" or "Cancel."

### Input Fields
*   **Visuals:** `surface_container_high` background. No bottom line. Use `label-md` for floating labels that animate to `label-sm` on focus.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use extreme white space (vertical padding) to separate movie genres or categories.
*   **Do** use high-quality, high-contrast imagery as the primary driver of the UI color.
*   **Do** use the `secondary` (Electric Gold) sparingly—only for "Star Ratings" or "VIP" indicators.

### Don't:
*   **Don’t** use 100% white text on a black background. Always use `on_surface` (`#dae2fd`) to reduce eye strain and maintain the "navy" tonal depth.
*   **Don’t** use standard "drop shadows" on cards; they look dated. Rely on background color shifts.
*   **Don’t** use icons with varying stroke weights. Use a consistent 1.5px or 2px "Linear" icon set to match the sophisticated Inter typography.

---

### Director’s Final Note
This system is designed to disappear. The UI should feel like a dark theater—quiet, sophisticated, and supportive—allowing the "film" (the content) to be the only thing that truly shines. When in doubt, remove a line and add a margin.```