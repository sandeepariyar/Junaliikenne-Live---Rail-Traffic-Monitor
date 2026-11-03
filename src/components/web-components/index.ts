import React from 'react';
import { createComponent } from '@lit/react';

// Import custom elements to ensure registration
import { FtStatusBadgeElement } from './FtStatusBadgeElement';
import { FtAlertCardElement } from './FtAlertCardElement';
import { FtTabsElement } from './FtTabsElement';
import { FtToggleElement } from './FtToggleElement';
import { FtSegmentedControlElement } from './FtSegmentedControlElement';

export {
  FtStatusBadgeElement,
  FtAlertCardElement,
  FtTabsElement,
  FtToggleElement,
  FtSegmentedControlElement,
};

// React component wrappers via @lit/react for seamless integration
export const FtStatusBadgeWC = createComponent({
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

export const FtTabsWC = createComponent({
  tagName: 'ft-tabs',
  elementClass: FtTabsElement,
  react: React,
  events: {
    onTabChange: 'tab-change',
  },
});

export const FtToggleWC = createComponent({
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
