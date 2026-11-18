# Built-in filter gallery

Peter requested selectable sample filters, like CapCut, built from Screen Color's existing controls. He selected a mix of natural and cinematic styles.

Keep the current three-column layout. Add eight image cards to the Profiles page, rename its navigation to Filters, and retain saved profiles below the starter gallery. Add a direct Browse filters link beside the adjustment heading. Suggested starter names and values are implementation choices: Natural, Vivid, Golden, Cool, Soft, Cinema, Vintage and Mono. All use only saturation, contrast, warmth, brightness and tint. Applying a filter updates the same controls through the existing acknowledged preset action. Fine-tuning clears the built-in selection; Save as profile stores a personal copy. Keep Default and Custom preset one intact.

Use one immutable catalog shared between Node, main UI and quick controls. Validate built-in IDs during settings load, protect them from deletion and saved-ID collisions, and persist the selected filter without copying built-ins into user profiles. Use the local chosen preview image in filter thumbnails, falling back to the existing wallpaper. The active global desktop effect also affects samples shown by Electron. Explain this while enabled and provide Compare samples to turn the effect off explicitly for clean sample comparisons, preserving the selected profile. Clicking a card reenables its look.

Implementation sequence:

1. Write failing catalog/controller tests for allowed values, persistence, built-in protection, fine-tuning/saving and failed native applies.
2. Add shared catalog and integrate preset resolution, validation and quick-control choices.
3. Add gallery cards, local image samples, selected/disabled states, saved profile section and navigation link. Preserve keyboard focus when selections change.
4. Verify Node tests, browser gallery/actions/image updates/responsiveness, and isolated Electron smoke including selected filter synchronization. Review, capture matching before/after UI history and commit verified work locally on dev.

No downloads, new slider types, production builds, publishing or merging.
