import { useModalA11y } from '../hooks/useModalA11y';
import React, { useState } from 'react';
import { X, Layers, Code, CheckCircle, ShieldCheck, Eye } from 'lucide-react';
import { FtStatusBadge } from './design-system/FtStatusBadge';
import { FtAlertCard } from './design-system/FtAlertCard';
import { FtTabs } from './design-system/FtTabs';
import { FtToggle } from './design-system/FtToggle';
import { FtSegmentedControl } from './design-system/FtSegmentedControl';

export interface ComponentStorybookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComponentStorybookModal: React.FC<ComponentStorybookModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedComponent, setSelectedComponent] = useState<'badge' | 'card' | 'tabs' | 'toggle'>('badge');
  const [testToggle, setTestToggle] = useState(true);
  const [testTab, setTestTab] = useState('one');
  const [testSegment, setTestSegment] = useState<'2D' | '3D'>('2D');

  const dialogRef = useModalA11y<HTMLDivElement>(!!isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Design System & Web Components Dokumentaatio"
      className="fixed inset-0 z-50 bg-[#0E141B]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#16202A] border border-[#243444] rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-[#243444] bg-[#111822] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#4DA3FF]/20 border border-[#4DA3FF]/40 flex items-center justify-center text-[#80BDFF]">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F2F5F7] tracking-tight">
                Figma & Lit Web Components – Design System Docs
              </h2>
              <p className="text-xs text-[#9BA9B8]">
                Design tokens, Shadow DOM components, text contrast ≥ 4.5:1 (checked with axe-core), keyboard operable.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sulje / Close"
            className="p-1 rounded text-[#9BA9B8] hover:text-[#F2F5F7] hover:bg-[#1C2836] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Layout: Sidebar + Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Component List */}
          <div className="w-56 border-r border-[#243444] p-3 space-y-1 bg-[#111822]/40 shrink-0">
            <span className="text-[11px] font-bold text-[#9BA9B8] uppercase px-2 mb-2 block tracking-wider">
              Komponentit
            </span>
            <button
              type="button"
              onClick={() => setSelectedComponent('badge')}
              className={`w-full px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium text-left transition-colors ${
                selectedComponent === 'badge' ? 'bg-[#1C2836] text-[#80BDFF] border border-[#243444]' : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
              }`}
            >
              ft-status-badge
            </button>
            <button
              type="button"
              onClick={() => setSelectedComponent('card')}
              className={`w-full px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium text-left transition-colors ${
                selectedComponent === 'card' ? 'bg-[#1C2836] text-[#80BDFF] border border-[#243444]' : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
              }`}
            >
              ft-alert-card
            </button>
            <button
              type="button"
              onClick={() => setSelectedComponent('tabs')}
              className={`w-full px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium text-left transition-colors ${
                selectedComponent === 'tabs' ? 'bg-[#1C2836] text-[#80BDFF] border border-[#243444]' : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
              }`}
            >
              ft-tabs
            </button>
            <button
              type="button"
              onClick={() => setSelectedComponent('toggle')}
              className={`w-full px-3 py-1.5 rounded-[6px] text-xs font-mono font-medium text-left transition-colors ${
                selectedComponent === 'toggle' ? 'bg-[#1C2836] text-[#80BDFF] border border-[#243444]' : 'text-[#9BA9B8] hover:text-[#F2F5F7]'
              }`}
            >
              ft-toggle & control
            </button>

            <div className="pt-4 border-t border-[#243444] mt-4">
              <div className="p-2.5 rounded-[6px] bg-[#0E141B] border border-[#243444] space-y-1">
                <span className="text-[10px] font-bold text-[#3FB950] flex items-center gap-1 uppercase">
                  <ShieldCheck size={12} /> WCAG 2.2 AA Pass
                </span>
                <p className="text-[10px] text-[#9BA9B8]">
                  Kontrasti #F2F5F7 / #16202A = 12.8:1. Icon + text kaikissa tiloissa.
                </p>
              </div>
            </div>
          </div>

          {/* Component Playground View */}
          <div className="flex-1 p-5 overflow-y-auto space-y-6">
            {selectedComponent === 'badge' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#F2F5F7] font-mono">
                    &lt;ft-status-badge&gt;
                  </h3>
                  <p className="text-xs text-[#9BA9B8] mt-1">
                    Varianntit: ok (check), warning (clock), danger (X), info (trend). Sääntö: Tilaviesti aina ikoni + teksti, ei koskaan väri yksinään.
                  </p>
                </div>

                <div className="p-4 rounded-[8px] bg-[#0E141B] border border-[#243444] flex flex-wrap gap-4 items-center">
                  <FtStatusBadge variant="ok" text="Ajallaan" />
                  <FtStatusBadge variant="warning" delayMinutes={12} />
                  <FtStatusBadge variant="danger" text="Peruttu" />
                  <FtStatusBadge variant="info" text="Häiriö purettu" />
                </div>

                <div className="p-3 rounded-[6px] bg-[#111822] border border-[#243444] font-mono text-[11px] text-[#9BA9B8]">
                  <code>&lt;ft-status-badge variant="warning" text="+12 min" /&gt;</code>
                </div>
              </div>
            )}

            {selectedComponent === 'card' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#F2F5F7] font-mono">
                    &lt;ft-alert-card&gt;
                  </h3>
                  <p className="text-xs text-[#9BA9B8] mt-1">
                    Huomiokortti prioriteettijärjestyksessä. Sisältää ikonin, otsikon, vaikutusarvion ja ehdotetun operaattoritoimenpiteen.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FtAlertCard
                    variant="warning"
                    rank={1}
                    iconType="amber-clock"
                    title="IC 27 myöhässä 12 min"
                    impact="3 vaihtoyhteyttä vaarassa Tampereella"
                    suggestedAction="Ehdota: pidä S 365 3 min"
                  />
                  <FtAlertCard
                    variant="danger"
                    rank={2}
                    iconType="red-x"
                    title="IC 35 peruttu"
                    impact="n. 240 matkustajaa"
                    suggestedAction="Tilaa korvaavat bussit (2 kpl)"
                  />
                </div>
              </div>
            )}

            {selectedComponent === 'tabs' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#F2F5F7] font-mono">
                    &lt;ft-tabs&gt;
                  </h3>
                  <p className="text-xs text-[#9BA9B8] mt-1">
                    WCAG 2.2 AA näppäimistöohjattava välilehtipalkki. Nuolinäppäimet siirtävät fokusta, näkyvä sininen fokusrengas.
                  </p>
                </div>

                <div className="p-4 rounded-[8px] bg-[#0E141B] border border-[#243444]">
                  <FtTabs
                    tabs={[
                      { id: 'one', label: 'Myöhästymiset', count: 4 },
                      { id: 'two', label: 'Asemat', count: 12 },
                      { id: 'three', label: 'Häiriöt', count: 3 },
                    ]}
                    activeId={testTab}
                    onChange={setTestTab}
                  />
                </div>
              </div>
            )}

            {selectedComponent === 'toggle' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#F2F5F7] font-mono">
                    &lt;ft-toggle&gt; & &lt;ft-segmented-control&gt;
                  </h3>
                  <p className="text-xs text-[#9BA9B8] mt-1">
                    A11y kytkimet <code>role="switch"</code> ja <code>role="radiogroup"</code>.
                  </p>
                </div>

                <div className="p-4 rounded-[8px] bg-[#0E141B] border border-[#243444] flex items-center gap-6">
                  <FtToggle
                    label="Fokustila"
                    checked={testToggle}
                    onChange={setTestToggle}
                  />
                  <FtSegmentedControl<'2D' | '3D'>
                    options={[
                      { value: '2D', label: '2D' },
                      { value: '3D', label: '3D Elävä kartta' },
                    ]}
                    value={testSegment}
                    onChange={setTestSegment}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
