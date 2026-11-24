import React from "react";
import { Checkbox, FormControlLabel, Grid } from "@material-ui/core";
import { ConstantBasedPicker, TextInput, useModulesManager, useTranslations } from "@openimis/fe-core";
import _debounce from "lodash/debounce";

import { APPRAISAL_MODULE_NAME, DEFAULT_DEBOUNCE_TIME, ELIGIBILITIES, STATUSES } from "../constants";

function AppraisalFilter({ classes, filters, onChangeFilters }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const debounced = _debounce(onChangeFilters, DEFAULT_DEBOUNCE_TIME);
  const value = (name) => filters?.[name]?.value;
  const text = (name, filter) => (v) =>
    debounced([{ id: name, value: v, filter: v ? filter(JSON.stringify(v)) : null }]);
  const choice = (name) => (v) => onChangeFilters([{ id: name, value: v, filter: v ? `${name}: ${v}` : null }]);

  return (
    <Grid container className={classes?.form}>
      <Grid item xs={3} className={classes?.item}>
        <TextInput
          module={APPRAISAL_MODULE_NAME}
          label="filter.search"
          value={value("search") ?? ""}
          onChange={text("search", (v) => `search: ${v}`)}
        />
      </Grid>
      <Grid item xs={2} className={classes?.item}>
        <TextInput
          module={APPRAISAL_MODULE_NAME}
          label="filter.programme"
          value={value("programme") ?? ""}
          onChange={text("programme", (v) => `programme: ${v}`)}
        />
      </Grid>
      <Grid item xs={2} className={classes?.item}>
        <ConstantBasedPicker
          module={APPRAISAL_MODULE_NAME}
          label="filter.status"
          constants={STATUSES}
          value={value("status")}
          onChange={choice("status")}
          withNull
        />
      </Grid>
      <Grid item xs={2} className={classes?.item}>
        <ConstantBasedPicker
          module={APPRAISAL_MODULE_NAME}
          label="filter.eligibility"
          constants={ELIGIBILITIES}
          value={value("eligibility")}
          onChange={choice("eligibility")}
          withNull
        />
      </Grid>
      <Grid item xs={3} className={classes?.item}>
        <FormControlLabel
          control={
            <Checkbox
              color="primary"
              checked={!!value("needsReview")}
              onChange={(e) =>
                onChangeFilters([
                  { id: "needsReview", value: e.target.checked, filter: e.target.checked ? "needsReview: true" : null },
                ])
              }
            />
          }
          label={formatMessage("filter.needsReview")}
        />
      </Grid>
    </Grid>
  );
}

export default AppraisalFilter;
