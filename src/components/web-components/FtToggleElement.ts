import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * <ft-toggle>
 * Lit Web Component for on/off settings (APG switch pattern).
 * Optional leading icon via the `icon` slot.
 */
@customElement('ft-toggle')
export class FtToggleElement extends LitElement {
  @property({ type: String }) label: string = '';
  @property({ type: Boolean }) checked: boolean = false;
  @state() private hasIcon = false;

  private onIconSlot(e: Event) {
    this.hasIcon = (e.target as HTMLSlotElement).assignedElements().length > 0;
  }

  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    .wrapper {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary, #F2F5F7);
      padding: 4px 6px;
      border-radius: 6px;
      transition: background-color 0.15s ease;
    }

    .wrapper:hover {
      background-color: var(--surface-raised, #1C2836);
    }

    .icon {
      display: inline-flex;
      color: var(--text-secondary, #9BA9B8);
    }

    .icon[hidden] { display: none; }

    .switch {
      position: relative;
      display: inline-flex;
      width: 34px;
      height: 18px;
      border-radius: 9999px;
      background-color: #243444;
      transition: background-color 0.2s ease;
      border: 2px solid #8A9AAB; /* >= 3:1 non-text contrast when off */
      outline: none;
      cursor: pointer;
    }

    .switch:focus-visible {
      outline: 2px solid var(--color-info, #4DA3FF);
      outline-offset: 2px;
    }

    .switch.checked {
      background-color: var(--color-info, #4DA3FF);
      border-color: transparent;
    }

    .knob {
      display: block;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #FFFFFF;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .switch.checked .knob {
      transform: translateX(16px);
    }

    @media (prefers-reduced-motion: reduce) {
      .switch, .knob {
        transition: none;
      }
    }
  `;

  override render() {
    return html`
      <div class="wrapper" @click="${this.toggle}">
        <span class="icon" aria-hidden="true" ?hidden="${!this.hasIcon}"><slot name="icon" @slotchange="${this.onIconSlot}"></slot></span>
        <span>${this.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked="${this.checked}"
          aria-label="${this.label}"
          class="switch ${this.checked ? 'checked' : ''}"
        >
          <span class="knob" aria-hidden="true"></span>
        </button>
      </div>
    `;
  }

  private toggle() {
    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent('toggle-change', {
        detail: { checked: this.checked },
        bubbles: true,
        composed: true,
      })
    );
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'ft-toggle': FtToggleElement;
  }
}
