import React from "react";
import flatten from "flat";
import { FormattedMessage } from "@openimis/fe-core";
import AssignmentTurnedInIcon from "@material-ui/icons/AssignmentTurnedIn";

import messages_en from "./translations/en.json";
import reducer from "./reducer";
import AppraisalsPage from "./pages/AppraisalsPage";
import AppraisalPage from "./pages/AppraisalPage";
import { APPRAISAL_MODULE_NAME, RIGHT_APPRAISAL_VIEW, ROUTE_APPRAISAL, ROUTE_APPRAISALS } from "./constants";

const DEFAULT_CONFIG = {
  translations: [{ key: "en", messages: flatten(messages_en) }],
  reducers: [{ key: APPRAISAL_MODULE_NAME, reducer }],
  "core.Router": [
    { path: ROUTE_APPRAISALS, component: AppraisalsPage },
    { path: `${ROUTE_APPRAISAL}/:appraisal_uuid`, component: AppraisalPage },
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
  ],
};

export const AppraisalModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
