import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface LitSegmentOption {
  value: string;
  label: string;
}

/**
 * <ft-segmented-control>
 * Lit Web Component for 2D | 3D Elävä kartta
 */
@customElement('ft-segmented-control')
export class FtSegmentedControlElement extends LitElement {
  @property({ type: Array }) options: LitSegmentOption[] = [
    { value: '2D', label: '2D' },
    { value: '3D', label: '3D Elävä kartta' },
  ];
  @property({ type: String }) selectedValue: string = '2D';

  static override styles = css`
    :host {
      display: inline-flex;
    }

    .container {
      display: inline-flex;
      align-items: center;
      padding: 2px;
      border-radius: 8px;
      background-color: var(--bg-primary, #0E141B);
      border: 1px solid var(--border-subtle, #243444);
    }

    button {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary, #9BA9B8);
      background: transparent;
      border: 1px solid transparent;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition: all 0.15s ease;
      font-family: inherit;
      outline: none;
    }

    button:hover {
      color: var(--text-primary, #F2F5F7);
      background-color: rgba(255, 255, 255, 0.05);
    }

    button:focus-visible {
      outline: 2px solid var(--color-info, #4DA3FF);
    }

    button.selected {
      background-color: var(--surface-raised, #1C2836);
      color: var(--text-primary, #F2F5F7);
      font-weight: 600;
      border-color: rgba(77, 163, 255, 0.3);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  `;

  override render() {
    return html`
      <div class="container" role="radiogroup" aria-label="Valitse karttanäkymä">
        ${this.options.map(
          (opt, i) => html`
            <button
              type="button"
              role="radio"
              aria-checked="${opt.value === this.selectedValue}"
              tabindex="${opt.value === this.selectedValue ? '0' : '-1'}"
              @keydown="${(e: KeyboardEvent) => this.onKey(e, i)}"
              class="${opt.value === this.selectedValue ? 'selected' : ''}"
              @click="${() => this.select(opt.value)}"
            >
              ${opt.label}
            </button>
          `
        )}
      </div>
    `;
  }

  private onKey(e: KeyboardEvent, i: number) {
    const n = this.options.length;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
    if (next < 0) return;
    e.preventDefault();
    this.select(this.options[next].value);
    this.updateComplete.then(() => this.shadowRoot?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus());
  }

  private select(val: string) {
    this.selectedValue = val;
    this.dispatchEvent(
      new CustomEvent('segment-change', {
        detail: { value: val },
        bubbles: true,
        composed: true,
      })
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ft-segmented-control': FtSegmentedControlElement;
  }
}
