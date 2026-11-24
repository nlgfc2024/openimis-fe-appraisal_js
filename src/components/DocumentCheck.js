import React from "react";
import { Box, Button, Divider, Grid, Typography } from "@material-ui/core";
import {
  PublishedComponent,
  WarningBox,
  formatDateTimeFromISO,
  useModulesManager,
  useTranslations,
} from "@openimis/fe-core";
import { useIntl } from "react-intl";

import {
  APPRAISAL_MODULE_NAME,
  DOCUMENT_OUTSTANDING,
  DOCUMENT_REJECTED,
  DOCUMENT_SUBMITTED,
  DOCUMENT_VERIFIED,
  REF_APPLICANT_DOCUMENTS,
} from "../constants";
import useAppraisalStyles from "../styles";
import { documentProblems } from "../util/appraisal";
import StatCard from "./StatCard";

function DocumentReviewActions({ review, canReview, saving, error, onVerify, onReject }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  if (!review) return null;
  return (
    <>
      <Typography
        variant="body2"
        className={error || review.status === DOCUMENT_REJECTED ? classes.warning : classes.muted}
      >
        {error ||
          (review.reviewedBy
            ? formatMessageWithValues("documents.reviewedAs", {
                status: formatMessage(`documentStatus.${review.status}`),
                user: review.reviewedBy,
              })
            : formatMessage("documents.notReviewed"))}
      </Typography>
      {canReview && (
        <>
          <Button
            variant="outlined"
            className={classes.rejectButton}
            disabled={saving}
            onClick={() => onReject(review)}
          >
            {formatMessage("action.reject")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={saving || review.status === DOCUMENT_VERIFIED}
            onClick={() => onVerify(review)}
          >
            {formatMessage("action.verify")}
          </Button>
        </>
      )}
    </>
  );
}

function DocumentCheck({ appraisal, canReview, saving, error, onVerify, onReject }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const documents = appraisal.documents || [];
  const problems = documentProblems(documents);
  const count = (status) => documents.filter((doc) => doc.status === status).length;
  const reviewOf = (document) => documents.find((doc) => doc.documentId === document.id);

  const named = problems
    .filter((problem) => problem.status !== DOCUMENT_SUBMITTED)
    .map((problem) =>
      formatMessageWithValues("documents.problem", {
        label: problem.label,
        status: formatMessage(`documentStatus.${problem.status}`).toLowerCase(),
      }),
    );
  const toVerify = problems.filter((problem) => problem.status === DOCUMENT_SUBMITTED).length;
  if (toVerify) named.push(formatMessageWithValues("documents.toVerify", { count: toVerify }));

  const columns = [
    {
      key: "review",
      header: formatMessage("documents.review"),
      render: (document) => {
        const review = reviewOf(document);
        if (!review) return "";
        return (
          <>
            <Typography variant="body2" className={review.status === DOCUMENT_REJECTED ? classes.warning : undefined}>
              {formatMessage(`documentStatus.${review.status}`)}
              {review.required && (
                <Typography component="span" variant="caption" className={classes.muted}>
                  {` · ${formatMessage("documents.required")}`}
                </Typography>
              )}
            </Typography>
            {review.comment && (
              <Typography variant="caption" display="block">
                {review.comment}
              </Typography>
            )}
          </>
        );
      },
    },
    {
      key: "reviewedBy",
      header: formatMessage("documents.reviewed"),
      render: (document) => {
        const review = reviewOf(document);
        if (!review?.reviewedBy) return "";
        return (
          <Typography variant="caption">
            {review.reviewedBy}
            <br />
            {formatDateTimeFromISO(modulesManager, intl, review.reviewedAt)}
          </Typography>
        );
      },
    },
  ];

  return (
    <>
      <Grid container className={classes.item}>
        <StatCard
          md={3}
          label={formatMessage("documents.verified")}
          value={`${count(DOCUMENT_VERIFIED)} / ${documents.length}`}
          text
        />
        <StatCard md={3} label={formatMessage("documents.toReview")} value={count(DOCUMENT_SUBMITTED)} />
        <StatCard md={3} label={formatMessage("documents.rejected")} value={count(DOCUMENT_REJECTED)} />
        <StatCard md={3} label={formatMessage("documents.outstanding")} value={count(DOCUMENT_OUTSTANDING)} />
      </Grid>
      {!!named.length && (
        <Grid container className={classes.item}>
          <WarningBox title={formatMessage("documents.incomplete")} description={named.join("; ")} xs={12} />
        </Grid>
      )}
      <Divider />
      <Box className={classes.section}>
        <PublishedComponent
          pubRef={REF_APPLICANT_DOCUMENTS}
          individualId={appraisal.individual?.uuid}
          compact
          columns={columns}
          rowHighlighted={(document) => reviewOf(document)?.status === DOCUMENT_REJECTED}
          viewerActions={(document) => (
            <DocumentReviewActions
              review={reviewOf(document)}
              canReview={canReview}
              saving={saving}
              error={error}
              onVerify={onVerify}
              onReject={onReject}
            />
          )}
        />
      </Box>
    </>
  );
}

export default DocumentCheck;
