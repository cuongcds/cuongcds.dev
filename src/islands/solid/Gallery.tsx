/** @jsxImportSource solid-js */
import { For, Show, createEffect, createSignal, onMount } from 'solid-js';

interface Shot {
  id: string;
  title: string;
  caption: string;
  src: string;
  group: string;
}

export default function Gallery(props: { shots: Shot[] }) {
  const [index, setIndex] = createSignal<number | null>(null);
  const shot = () => { const i = index(); return i === null ? null : props.shots[i]; };
  const step = (delta: number) => setIndex(i => (i === null ? i : (i + delta + props.shots.length) % props.shots.length));
  const close = () => setIndex(null);
  let dialog!: HTMLDivElement;
  let lastFocus: HTMLElement | null = null;

  createEffect(() => {
    if (index() !== null) {
      lastFocus = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      dialog?.focus();
    } else {
      document.body.style.overflow = '';
      lastFocus?.focus?.();
    }
  });

  function onKey(e: KeyboardEvent) {
    if (index() === null) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  }
  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  });

  return (
    <div class="arcade-gallery">
      <ul>
        <For each={props.shots}>
          {(s, i) => (
            <li>
              <button class="shot-thumb" onClick={() => setIndex(i())} aria-label={`View ${s.title} fullscreen`}>
                <img src={`/gallery/${s.id}.webp`} alt={s.title} width="600" height="375" loading="lazy" decoding="async" />
              </button>
              <p class="shot-caption">{s.caption}</p>
            </li>
          )}
        </For>
      </ul>
      <Show when={shot()}>
        <div
          class="arcade-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${shot()!.title} — screenshot viewer`}
          tabIndex={-1}
          ref={element => { dialog = element; }}
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <p class="viewer-eyebrow">Now playing · Stage {index()! + 1} of {props.shots.length}</p>
          <div class="viewer-screen" onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <img src={shot()!.src} alt={shot()!.title} />
          </div>
          <div class="viewer-bar">
            <button onClick={() => step(-1)}>◀ Prev</button>
            <p class="viewer-caption">{shot()!.caption}</p>
            <button onClick={() => step(1)}>Next ▶</button>
            <button class="viewer-exit" onClick={close}>✕ Exit</button>
          </div>
        </div>
      </Show>
    </div>
  );
}
