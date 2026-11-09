import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type AlertCardVariant = 'warning' | 'danger' | 'info';

/**
 * <ft-alert-card>
 * Lit Web Component for attention-now cards
 * Handles Shadow DOM, keyboard focus, and dispatching action events.
 */
@customElement('ft-alert-card')
export class FtAlertCardElement extends LitElement {
  @property({ type: String }) variant: AlertCardVariant = 'warning';
  @property({ type: Number }) rank: number = 1;
  @property({ type: String }) cardTitle: string = '';
  @property({ type: String }) impact: string = '';
  @property({ type: String }) suggestedAction: string = '';
  @property({ type: Boolean }) actionDone: boolean = false;
  @property({ type: Boolean }) isSelected: boolean = false;

  static override styles = css`
    :host {
      display: block;
      outline: none;
    }

    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14px;
      border-radius: 8px;
      background-color: var(--surface, #16202A);
      border: 1px solid var(--border-subtle, #243444);
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      height: 100%;
    }

    .card:hover {
      background-color: var(--surface-raised, #1C2836);
    }

    .card:focus-visible {
      outline: 2px solid var(--color-info, #4DA3FF);
      outline-offset: 2px;
    }

    .card.selected {
      border-color: var(--color-info, #4DA3FF);
      background-color: #1C2836;
      box-shadow: 0 0 0 1px rgba(77, 163, 255, 0.4);
    }

    /* Variant-specific styling */
    .variant-warning {
      border-left: 3px solid #F0A030;
    }
    .variant-warning:hover {
      border-color: rgba(240, 160, 48, 0.6);
    }

    .variant-danger {
      border-left: 3px solid #F25555;
    }
    .variant-danger:hover {
      border-color: rgba(242, 85, 85, 0.6);
    }

    .variant-info {
      border-left: 3px solid #4DA3FF;
    }
    .variant-info:hover {
      border-color: rgba(77, 163, 255, 0.6);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .rank-badge {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      font-family: var(--font-mono, monospace);
    }

    .variant-warning .rank-badge {
      background: rgba(240, 160, 48, 0.2);
      color: #F0A030;
    }
    .variant-danger .rank-badge {
      background: rgba(242, 85, 85, 0.2);
      color: #FF8080;
    }
    .variant-info .rank-badge {
      background: rgba(77, 163, 255, 0.2);
      color: #80BDFF;
    }

    .icon-box {
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .variant-warning .icon-box {
      background: rgba(240, 160, 48, 0.15);
      color: #F0A030;
    }
    .variant-danger .icon-box {
      background: rgba(242, 85, 85, 0.15);
      color: #FF8080;
    }
    .variant-info .icon-box {
      background: rgba(77, 163, 255, 0.15);
      color: #80BDFF;
    }

    .title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #F2F5F7);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .impact {
      font-size: 13px;
      color: var(--text-secondary, #9BA9B8);
      margin: 0 0 12px 28px;
      line-height: 1.35;
    }

    .footer {
      border-top: 1px solid rgba(36, 52, 68, 0.7);
      padding-top: 8px;
      margin-top: auto;
    }

    .action-btn {
      width: 100%;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      background: transparent;
      outline: none;
    }

    .action-btn:focus-visible {
      outline: 2px solid var(--color-info, #4DA3FF);
    }

    .variant-warning .action-btn {
      background: rgba(240, 160, 48, 0.15);
      color: #F0A030;
      border-color: rgba(240, 160, 48, 0.4);
    }
    .variant-warning .action-btn:hover {
      background: rgba(240, 160, 48, 0.25);
    }

    .variant-danger .action-btn {
      background: rgba(242, 85, 85, 0.15);
      color: #FF8080;
      border-color: rgba(242, 85, 85, 0.4);
    }
    .variant-danger .action-btn:hover {
      background: rgba(242, 85, 85, 0.25);
    }

    .variant-info .action-btn {
      background: rgba(77, 163, 255, 0.15);
      color: #80BDFF;
      border-color: rgba(77, 163, 255, 0.4);
    }
    .variant-info .action-btn:hover {
      background: rgba(77, 163, 255, 0.25);
    }

    .action-btn.done {
      background: rgba(63, 185, 80, 0.2) !important;
      color: #3FB950 !important;
      border-color: rgba(63, 185, 80, 0.4) !important;
    }

    svg {
      flex-shrink: 0;
    }
  `;

  override render() {
    return html`
      <div
        class="card variant-${this.variant} ${this.isSelected ? 'selected' : ''}"
        tabindex="0"
        role="button"
        @keydown="${this.handleKeyDown}"
        @click="${this.handleCardClick}"
      >
        <div>
          <div class="header">
            <span class="rank-badge">#${this.rank}</span>
            <div class="icon-box">
              ${this.renderIcon()}
            </div>
            <h3 class="title">${this.cardTitle}</h3>
          </div>
          <p class="impact">${this.impact}</p>
        </div>

        ${this.suggestedAction
          ? html`
              <div class="footer">
                <button
                  type="button"
                  class="action-btn ${this.actionDone ? 'done' : ''}"
                  @click="${this.handleActionClick}"
                >
                  ${this.actionDone
                    ? html`
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>Toimenpide aktivoitu</span>
                      `
                    : html`
                        <span>${this.suggestedAction}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      `}
                </button>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private renderIcon() {
    switch (this.variant) {
      case 'warning':
        return html`
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        `;
      case 'danger':
        return html`
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      case 'info':
        return html`
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        `;
    }
  }

  private handleCardClick() {
    this.dispatchEvent(new CustomEvent('card-select', { bubbles: true, composed: true }));
  }

  private handleActionClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('action-click', { bubbles: true, composed: true }));
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleCardClick();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ft-alert-card': FtAlertCardElement;
  }
}
