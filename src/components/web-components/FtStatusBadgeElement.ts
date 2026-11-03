import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type StatusBadgeVariant = 'ok' | 'warning' | 'danger' | 'info';

/**
 * <ft-status-badge>
 * Standards-compliant Lit Web Component
 * Features Shadow DOM, design tokens via CSS custom properties, and WCAG 2.2 AA accessibility.
 * Rule: Always pairs an explicit icon with legible text, NEVER color alone.
 */
@customElement('ft-status-badge')
export class FtStatusBadgeElement extends LitElement {
  @property({ type: String }) variant: StatusBadgeVariant = 'ok';
  @property({ type: String }) text: string = '';
  @property({ type: Number }) delayMinutes: number | undefined = undefined;
  @property({ type: String }) size: 'sm' | 'md' = 'md';

  static override styles = css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      font-family: var(--font-mono, 'JetBrains Mono', monospace);
      font-variant-numeric: tabular-nums;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      font-weight: 600;
      line-height: 1;
      border-radius: 6px;
      border: 1px solid transparent;
      user-select: none;
      white-space: nowrap;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .size-sm {
      font-size: 11px;
      padding: 3px 6px;
      gap: 4px;
    }

    .size-md {
      font-size: 12px;
      padding: 4px 8px;
      gap: 6px;
    }

    /* Tokens & High Contrast Variants */
    .variant-ok {
      background-color: rgba(63, 185, 80, 0.15);
      color: #3FB950;
      border-color: rgba(63, 185, 80, 0.35);
    }

    .variant-warning {
      background-color: rgba(240, 160, 48, 0.15);
      color: #F0A030;
      border-color: rgba(240, 160, 48, 0.4);
    }

    .variant-danger {
      background-color: rgba(242, 85, 85, 0.15);
      color: #FF8080;
      border-color: rgba(242, 85, 85, 0.4);
    }

    .variant-info {
      background-color: rgba(77, 163, 255, 0.15);
      color: #80BDFF;
      border-color: rgba(77, 163, 255, 0.4);
    }

    svg {
      flex-shrink: 0;
      display: block;
    }

    @media (forced-colors: active) {
      .badge {
        border: 2px solid ButtonText;
      }
    }
  `;

  override render() {
    let effectiveVariant = this.variant;
    let effectiveLabel = this.text;

    if (this.delayMinutes !== undefined) {
      if (this.delayMinutes <= 0) {
        effectiveVariant = 'ok';
        effectiveLabel = effectiveLabel || 'Ajallaan';
      } else if (this.delayMinutes < 15) {
        effectiveVariant = 'warning';
        effectiveLabel = effectiveLabel || `+${this.delayMinutes} min`;
      } else {
        effectiveVariant = 'danger';
        effectiveLabel = effectiveLabel || `+${this.delayMinutes} min`;
      }
    }

    const iconSize = this.size === 'sm' ? 12 : 14;

    return html`
      <span
        class="badge size-${this.size} variant-${effectiveVariant}"
        role="status"
        aria-label="${effectiveLabel}"
      >
        ${this.renderIcon(effectiveVariant, iconSize)}
        <span>${effectiveLabel}</span>
      </span>
    `;
  }

  private renderIcon(variant: StatusBadgeVariant, size: number) {
    switch (variant) {
      case 'ok':
        return html`
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
      case 'warning':
        return html`
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        `;
      case 'danger':
        return html`
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      case 'info':
        return html`
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ft-status-badge': FtStatusBadgeElement;
  }
}
