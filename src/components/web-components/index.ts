import React from 'react';
import { createComponent } from '@lit/react';

// Importing the element modules registers the custom elements (<ft-*>).
import { FtStatusBadgeElement } from './FtStatusBadgeElement';
import { FtAlertCardElement } from './FtAlertCardElement';
import { FtTabsElement } from './FtTabsElement';
import { FtToggleElement } from './FtToggleElement';
import { FtSegmentedControlElement } from './FtSegmentedControlElement';

export type { LitTabItem } from './FtTabsElement';
export type { StatusBadgeVariant } from './FtStatusBadgeElement';

export {
  FtStatusBadgeElement,
  FtAlertCardElement,
  FtTabsElement,
  FtToggleElement,
  FtSegmentedControlElement,
};

/*
 * React wrappers generated with @lit/react — the same pattern Fintraffic's
 * fds-coreui-components-react uses. One implementation (the Lit element),
 * consumed by React here and by plain HTML in /components.html.
 */
export const FtStatusBadge = createComponent({
  tagName: 'ft-status-badge',
  elementClass: FtStatusBadgeElement,
  react: React,
});

export const FtAlertCardWC = createComponent({
  tagName: 'ft-alert-card',
  elementClass: FtAlertCardElement,
  react: React,
  events: {
    onActionClick: 'action-click',
    onCardSelect: 'card-select',
  },
});

export const FtTabs = createComponent({
  tagName: 'ft-tabs',
  elementClass: FtTabsElement,
  react: React,
  events: {
    onTabChange: 'tab-change',
  },
});

export const FtToggle = createComponent({
  tagName: 'ft-toggle',
  elementClass: FtToggleElement,
  react: React,
  events: {
    onToggleChange: 'toggle-change',
  },
});

export const FtSegmentedControlWC = createComponent({
  tagName: 'ft-segmented-control',
  elementClass: FtSegmentedControlElement,
  react: React,
  events: {
    onSegmentChange: 'segment-change',
  },
});
