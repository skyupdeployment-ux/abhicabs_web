import React from "react";
import ServiceContentForm, { jumpToServiceField } from "./ServiceContentForm";
import ServiceLivePreview from "./ServiceLivePreview";
import { ChecklistPanel } from "./PublishChecklist";
import { buildServiceChecklist } from "./serviceChecklist";

/**
 * Two-pane workspace for a CMS service page: checklist + content form on the left,
 * a sticky live preview of the real template on the right (stacked on narrow screens).
 */
export default function ServiceWorkspace({ slug, content, onChange, canEdit, groups, onUpload, liveUrl }) {
  const items = buildServiceChecklist(content);
  return (
    <div className="svc-ws">
      <style>{`
        .svc-ws { display:grid; grid-template-columns:minmax(0,1fr); gap:16px; align-items:start; }
        .svc-ws-preview { height:640px; }
        @media (min-width:1100px) {
          .svc-ws { grid-template-columns:minmax(0,1fr) minmax(0,46%); }
          .svc-ws-preview { position:sticky; top:12px; height:calc(100vh - 110px); }
        }
      `}</style>
      <div style={{ minWidth: 0 }}>
        <div id="svc-checklist" style={{ scrollMarginTop: 12 }}>
          <ChecklistPanel items={items} onFix={jumpToServiceField} className="mb-4" />
        </div>
        <ServiceContentForm content={content} onChange={onChange} canEdit={canEdit} groups={groups} onUpload={onUpload} />
      </div>
      <div className="svc-ws-preview">
        <ServiceLivePreview slug={slug} content={content} liveUrl={liveUrl} />
      </div>
    </div>
  );
}
