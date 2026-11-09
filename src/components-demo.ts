// Plain-HTML demo: registers the Lit custom elements directly — no React involved.
import './components/web-components/FtStatusBadgeElement';
import './components/web-components/FtTabsElement';
import './components/web-components/FtToggleElement';
import './components/web-components/FtSegmentedControlElement';

const tabs = document.querySelector('ft-tabs')!;
tabs.tabs = [
  { id: 'delays', label: 'Delays', count: 4 },
  { id: 'stations', label: 'Stations', count: 12 },
  { id: 'disruptions', label: 'Disruptions', count: 3 },
];
const panelText = document.getElementById('tab-panel-text')!;
tabs.addEventListener('tab-change', (e) => {
  const id = (e as CustomEvent<{ activeId: string }>).detail.activeId;
  tabs.activeTabId = id;
  panelText.textContent = `Panel: ${id}`;
});

const toggle = document.querySelector('ft-toggle')!;
const toggleOut = document.getElementById('toggle-out')!;
toggle.addEventListener('toggle-change', (e) => {
  toggleOut.textContent = `checked: ${(e as CustomEvent<{ checked: boolean }>).detail.checked}`;
});

const seg = document.querySelector('ft-segmented-control')!;
const segOut = document.getElementById('seg-out')!;
seg.addEventListener('segment-change', (e) => {
  const v = (e as CustomEvent<{ value: string }>).detail.value;
  seg.selectedValue = v;
  segOut.textContent = `value: ${v}`;
});
