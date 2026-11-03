import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface LitTabItem {
  id: string;
  label: string;
  count?: number;
}

/**
 * <ft-tabs>
 * Standards-compliant Lit Web Component for control-room tabs
 * Full keyboard navigation: Left/Right arrows, Home, End, visible focus ring.
 */
@customElement('ft-tabs')
export class FtTabsElement extends LitElement {
  @property({ type: Array }) tabs: LitTabItem[] = [];
  @property({ type: String }) activeTabId: string = '';

  static override styles = css`
    :host {
      display: block;
    }

    .tab-list {
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid var(--border-subtle, #243444);
      padding: 0 4px;
    }

    .tab-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #9BA9B8);
      background: transparent;
      border: none;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      transition: color 0.15s ease;
      outline: none;
      font-family: inherit;
    }

    .tab-btn:hover {
      color: var(--text-primary, #F2F5F7);
    }

    .tab-btn:focus-visible {
      outline: 2px solid var(--color-info, #4DA3FF);
      outline-offset: -2px;
      border-radius: 4px;
    }

    .tab-btn.active {
      color: var(--text-primary, #F2F5F7);
      font-weight: 600;
    }

    .active-bar {
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: var(--color-info, #4DA3FF);
      border-radius: 2px 2px 0 0;
      box-shadow: 0 -1px 8px rgba(77, 163, 255, 0.6);
    }

    .badge {
      font-size: 10px;
      font-weight: 700;
      font-family: var(--font-mono, monospace);
      padding: 2px 6px;
      border-radius: 9999px;
      background: #243444;
      color: #9BA9B8;
    }

    .tab-btn.active .badge {
      background: rgba(77, 163, 255, 0.2);
      color: #4DA3FF;
    }
  `;

  override render() {
    return html`
      <div class="tab-list" role="tablist" aria-label="Junaliikenteen tilanne välilehdet">
        ${this.tabs.map((tab, idx) => {
          const isActive = tab.id === this.activeTabId;
          return html`
            <button
              type="button"
              role="tab"
              id="tab-${tab.id}"
              aria-controls="panel-${tab.id}"
              aria-selected="${isActive}"
              tabindex="${isActive ? '0' : '-1'}"
              class="tab-btn ${isActive ? 'active' : ''}"
              @click="${() => this.selectTab(tab.id)}"
              @keydown="${(e: KeyboardEvent) => this.handleKeyDown(e, idx)}"
            >
              <span>${tab.label}</span>
              ${tab.count !== undefined
                ? html`<span class="badge">${tab.count}</span>`
                : ''}
              ${isActive ? html`<div class="active-bar" aria-hidden="true"></div>` : ''}
            </button>
          `;
        })}
      </div>
    `;
  }

  private selectTab(id: string) {
    this.activeTabId = id;
    this.dispatchEvent(
      new CustomEvent('tab-change', {
        detail: { activeId: id },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleKeyDown(e: KeyboardEvent, index: number) {
    let nextIndex = -1;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % this.tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = this.tabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const targetTab = this.tabs[nextIndex];
      this.selectTab(targetTab.id);
      const buttons = this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.tab-btn');
      buttons?.[nextIndex]?.focus();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ft-tabs': FtTabsElement;
  }
}
