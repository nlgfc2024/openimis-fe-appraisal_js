import React from "react";
import flatten from "flat";
import { FormattedMessage, useModulesManager } from "@openimis/fe-core";
import AssignmentTurnedInIcon from "@material-ui/icons/AssignmentTurnedIn";

import messages_en from "./translations/en.json";
import reducer from "./reducer";
import AppraisalsPage from "./pages/AppraisalsPage";
import AppraisalPage from "./pages/AppraisalPage";
import ShortlistPage from "./pages/ShortlistPage";
import ReportsPage from "./pages/ReportsPage";
import {
  AppraisalApprovalTaskItemFormatters,
  AppraisalApprovalTaskTableHeaders,
} from "./components/tasks/AppraisalApprovalTask";
import {
  APPRAISAL_MODULE_NAME,
  APPROVAL_TASK_SOURCE,
  RIGHT_APPRAISAL_VIEW,
  ROUTE_APPRAISAL,
  ROUTE_APPRAISALS,
  ROUTE_REPORTS,
  ROUTE_SHORTLIST,
} from "./constants";
import { configurationGate } from "./util/configuration";

const DEFAULT_CONFIG = {
  translations: [{ key: "en", messages: flatten(messages_en) }],
  reducers: [{ key: APPRAISAL_MODULE_NAME, reducer }],
  "core.Router": [
    { path: ROUTE_APPRAISALS, component: AppraisalsPage },
    { path: `${ROUTE_APPRAISAL}/:appraisal_uuid`, component: AppraisalPage },
    { path: ROUTE_SHORTLIST, component: ShortlistPage },
    { path: ROUTE_REPORTS, component: ReportsPage },
  ],
  "tasksManagement.tasks": [
    {
      text: <FormattedMessage module={APPRAISAL_MODULE_NAME} id="task.title" />,
      tableHeaders: AppraisalApprovalTaskTableHeaders,
      itemFormatters: AppraisalApprovalTaskItemFormatters,
      taskSource: [APPROVAL_TASK_SOURCE],
    },
  ],
  "socialProtection.MainMenu": [
    {
      text: <FormattedMessage module={APPRAISAL_MODULE_NAME} id="menu.appraisals" />,
      icon: <AssignmentTurnedInIcon />,
      route: `/${ROUTE_APPRAISALS}`,
      filter: (rights) => rights.includes(RIGHT_APPRAISAL_VIEW),
      id: `${APPRAISAL_MODULE_NAME}.appraisals`,
    },
  ],
  refs: [
    { key: `${APPRAISAL_MODULE_NAME}.route.appraisals`, ref: ROUTE_APPRAISALS },
    { key: `${APPRAISAL_MODULE_NAME}.route.appraisal`, ref: ROUTE_APPRAISAL },
    { key: `${APPRAISAL_MODULE_NAME}.route.shortlist`, ref: ROUTE_SHORTLIST },
    { key: `${APPRAISAL_MODULE_NAME}.route.reports`, ref: ROUTE_REPORTS },
  ],
};

export const AppraisalModule = (cfg) => {
  const config = { ...DEFAULT_CONFIG, ...cfg };
  const gate = configurationGate();
  function ConfigurationBoot() {
    gate.initialize(useModulesManager());
    return null;
  }
  const menuId = `${APPRAISAL_MODULE_NAME}.appraisals`;
  return {
    ...config,
    "core.Boot": [ConfigurationBoot, ...(config["core.Boot"] || [])],
    // Shown only where the backend appraises a programme, whatever the user's rights
    "socialProtection.MainMenu": (config["socialProtection.MainMenu"] || []).map((entry) =>
      entry.id === menuId
        ? { ...entry, filter: (rights) => gate.enabled() && (!entry.filter || entry.filter(rights)) }
        : entry,
    ),
  };
};
