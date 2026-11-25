// Whether this instance appraises any programme, read from the backend's exposed `appraisal` configuration (its
// `programmes`), so one backend setting decides it. A missing or unexposed configuration fails closed.
export const isAppraisalConfigured = (manager) => {
  const programmes = manager?.getConf?.("appraisal", "programmes", {});
  return !!programmes && typeof programmes === "object" && Object.keys(programmes).length > 0;
};

// core.Boot runs before the authenticated menu renders; keep the manager for the menu filter to read.
export function configurationGate() {
  let manager;
  return {
    initialize: (value) => {
      manager = value;
    },
    enabled: () => isAppraisalConfigured(manager),
  };
}
