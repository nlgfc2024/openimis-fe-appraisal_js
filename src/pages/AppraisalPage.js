import React, { useState } from "react";
import { useSelector } from "react-redux";
import LockOpenIcon from "@material-ui/icons/LockOpen";
import RefreshIcon from "@material-ui/icons/Refresh";
import ReturnIcon from "@material-ui/icons/AssignmentReturn";
import {
  Form,
  Helmet,
  ProgressOrError,
  useGraphqlMutation,
  useGraphqlQuery,
  useHistory,
  useModulesManager,
  useParams,
  useTranslations,
} from "@openimis/fe-core";

import {
  ANSWER_ITEM_MUTATION,
  ANSWER_SCORE_MUTATION,
  APPRAISAL_QUERY,
  DECIDE_ELIGIBILITY_MUTATION,
  REOPEN_APPRAISAL_MUTATION,
  RESUBMIT_APPRAISAL_MUTATION,
  RETURN_APPRAISAL_MUTATION,
  REVIEW_DOCUMENT_MUTATION,
  SCORE_APPRAISALS_MUTATION,
} from "../actions";
import AnswerItemDialog from "../components/AnswerItemDialog";
import AppraisalHeadPanel from "../components/AppraisalHeadPanel";
import AppraisalTabPanel from "../components/AppraisalTabPanel";
import DocumentRejectDialog from "../components/DocumentRejectDialog";
import ReopenDialog from "../components/ReopenDialog";
import { ResubmitDialog, ReturnDialog } from "../components/ReturnDialogs";
import ScoreDialog from "../components/ScoreDialog";
import { APPRAISAL_MODULE_NAME, DOCUMENT_REJECTED, DOCUMENT_VERIFIED, RIGHT_APPRAISAL_VIEW } from "../constants";
import useAppraisalStyles from "../styles";
import { isAppraisalConfigured } from "../util/configuration";
import { refusalCode } from "../util/appraisal";

function AppraisalPage() {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const { appraisal_uuid: appraisalUuid } = useParams();
  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const [answering, setAnswering] = useState(null);
  const [answerError, setAnswerError] = useState(null);
  const [decisionError, setDecisionError] = useState(null);
  const [scoring, setScoring] = useState(null);
  const [scoreError, setScoreError] = useState(null);
  const [rescoreError, setRescoreError] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState(null);
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState(null);

  const { isLoading, error, data, refetch } = useGraphqlQuery(
    APPRAISAL_QUERY,
    { id: appraisalUuid },
    { skip: !rights.includes(RIGHT_APPRAISAL_VIEW), keepStale: true },
  );
  const answerMutation = useGraphqlMutation(ANSWER_ITEM_MUTATION);
  const decideMutation = useGraphqlMutation(DECIDE_ELIGIBILITY_MUTATION);
  const scoreMutation = useGraphqlMutation(ANSWER_SCORE_MUTATION);
  const rescoreMutation = useGraphqlMutation(SCORE_APPRAISALS_MUTATION);
  const reviewMutation = useGraphqlMutation(REVIEW_DOCUMENT_MUTATION);
  const returnMutation = useGraphqlMutation(RETURN_APPRAISAL_MUTATION);
  const resubmitMutation = useGraphqlMutation(RESUBMIT_APPRAISAL_MUTATION);
  const reopenMutation = useGraphqlMutation(REOPEN_APPRAISAL_MUTATION);

  if (!rights.includes(RIGHT_APPRAISAL_VIEW) || !isAppraisalConfigured(modulesManager)) return null;
  const appraisal = data?.appraisal?.edges?.[0]?.node;
  const applicant = `${appraisal?.individual?.firstName ?? ""} ${appraisal?.individual?.lastName ?? ""}`.trim();
  // What the user may do now comes from the backend, worked out by the same rules as the mutations
  const canScreen = !!appraisal?.canScreen;
  const canScore = !!appraisal?.canScore;
  const canRescore = !!appraisal?.canRescore;
  const canReviewDocuments = !!appraisal?.canReviewDocuments;
  const canReturn = !!appraisal?.canReturn;
  const canReopen = !!appraisal?.canReopen;
  const canResubmit = !!appraisal?.canResubmit;
  const refusal = (err) => {
    const code = refusalCode(err);
    return code ? formatMessage(`refusal.${code}`) : String(err?.message || err);
  };

  const saveAnswer = async (answer) => {
    setAnswerError(null);
    try {
      await answerMutation.mutate({
        id: answering.uuid,
        result: answer.result,
        evidence: answer.evidence,
        comment: answer.comment,
        clientMutationLabel: formatMessageWithValues("mutation.answer", { item: answering.label, applicant }),
      });
      setAnswering(null);
      refetch();
    } catch (err) {
      setAnswerError(refusal(err));
    }
  };

  const decide = async (comment) => {
    setDecisionError(null);
    try {
      await decideMutation.mutate({
        id: appraisal.uuid,
        comment,
        clientMutationLabel: formatMessageWithValues("mutation.decide", { applicant }),
      });
      refetch();
    } catch (err) {
      setDecisionError(refusal(err));
    }
  };

  const saveScore = async (score) => {
    setScoreError(null);
    try {
      await scoreMutation.mutate({
        id: scoring.uuid,
        value: String(score.value).trim(),
        evidence: score.evidence,
        comment: score.comment,
        clientMutationLabel: formatMessageWithValues("mutation.score", { item: scoring.label, applicant }),
      });
      setScoring(null);
      refetch();
    } catch (err) {
      setScoreError(refusal(err));
    }
  };

  const rescore = async () => {
    setRescoreError(null);
    try {
      await rescoreMutation.mutate({
        programme: appraisal.programme,
        round: appraisal.round,
        ids: [appraisal.uuid],
        clientMutationLabel: formatMessageWithValues("mutation.rescore", { applicant }),
      });
      refetch();
    } catch (err) {
      setRescoreError(refusal(err));
    }
  };

  const submit = async (mutation, variables, setError, close) => {
    setError(null);
    try {
      await mutation.mutate(variables);
      close();
      refetch();
    } catch (err) {
      setError(refusal(err));
    }
  };

  const reviewDocument = (document, status, comment = "") =>
    submit(
      reviewMutation,
      {
        appraisalId: appraisal.uuid,
        documentId: document.documentId,
        status,
        comment,
        clientMutationLabel: formatMessageWithValues("mutation.reviewDocument", {
          status: formatMessage(`documentStatus.${status}`),
          document: document.label,
          applicant,
        }),
      },
      setReviewError,
      () => setRejecting(null),
    );

  const saveReturn = (details) =>
    submit(
      returnMutation,
      {
        id: appraisal.uuid,
        reason: details.reason,
        actionRequired: details.actionRequired,
        clientMutationLabel: formatMessageWithValues("mutation.return", { applicant }),
      },
      setReturnError,
      () => setReturning(false),
    );

  const saveResubmit = (note) =>
    submit(
      resubmitMutation,
      { id: appraisal.uuid, note, clientMutationLabel: formatMessageWithValues("mutation.resubmit", { applicant }) },
      setResubmitError,
      () => setResubmitting(false),
    );

  const saveReopen = (reason) =>
    submit(
      reopenMutation,
      { id: appraisal.uuid, reason, clientMutationLabel: formatMessageWithValues("mutation.reopen", { applicant }) },
      setReopenError,
      () => setReopening(false),
    );

  const actions = [{ doIt: refetch, icon: <RefreshIcon />, tooltip: formatMessage("action.refresh") }];
  if (canReturn) {
    actions.unshift({ doIt: () => setReturning(true), icon: <ReturnIcon />, tooltip: formatMessage("action.return") });
  }
  if (canReopen) {
    actions.unshift({
      doIt: () => setReopening(true),
      icon: <LockOpenIcon />,
      tooltip: formatMessage("action.reopen"),
    });
  }

  return (
    <div className={classes.page}>
      <Helmet title={formatMessageWithValues("appraisal.title", { applicant })} />
      <ProgressOrError progress={isLoading && !appraisal} error={error} />
      {appraisal && (
        <Form
          module={APPRAISAL_MODULE_NAME}
          title="appraisal.title"
          titleParams={{ applicant }}
          edited={appraisal}
          readOnly
          back={() => history.goBack()}
          actions={actions}
          HeadPanel={AppraisalHeadPanel}
          Panels={[AppraisalTabPanel]}
          canScreen={canScreen}
          onAnswer={setAnswering}
          onDecide={decide}
          deciding={decideMutation.isLoading}
          decisionError={decisionError}
          canScore={canScore}
          canRescore={canRescore}
          onScore={setScoring}
          onRescore={rescore}
          rescoring={rescoreMutation.isLoading}
          canReviewDocuments={canReviewDocuments}
          reviewingDocument={reviewMutation.isLoading}
          reviewError={rejecting ? null : reviewError}
          onVerifyDocument={(document) => reviewDocument(document, DOCUMENT_VERIFIED)}
          onRejectDocument={(document) => {
            setReviewError(null);
            setRejecting(document);
          }}
          canResubmit={canResubmit}
          onResubmit={() => setResubmitting(true)}
        />
      )}
      {rescoreError && <ProgressOrError error={rescoreError} />}
      <AnswerItemDialog
        item={answering}
        open={!!answering}
        saving={answerMutation.isLoading}
        error={answerError}
        onCancel={() => {
          setAnswering(null);
          setAnswerError(null);
        }}
        onSave={saveAnswer}
      />
      <ScoreDialog
        item={scoring}
        open={!!scoring}
        saving={scoreMutation.isLoading}
        error={scoreError}
        onCancel={() => {
          setScoring(null);
          setScoreError(null);
        }}
        onSave={saveScore}
      />
      <DocumentRejectDialog
        document={rejecting}
        saving={reviewMutation.isLoading}
        error={reviewError}
        onCancel={() => {
          setRejecting(null);
          setReviewError(null);
        }}
        onSave={(comment) => reviewDocument(rejecting, DOCUMENT_REJECTED, comment)}
      />
      <ReturnDialog
        open={returning}
        applicant={applicant}
        saving={returnMutation.isLoading}
        error={returnError}
        onCancel={() => {
          setReturning(false);
          setReturnError(null);
        }}
        onSave={saveReturn}
      />
      <ResubmitDialog
        open={resubmitting}
        saving={resubmitMutation.isLoading}
        error={resubmitError}
        onCancel={() => {
          setResubmitting(false);
          setResubmitError(null);
        }}
        onSave={saveResubmit}
      />
      <ReopenDialog
        open={reopening}
        applicant={applicant}
        decision={appraisal?.eligibility ? formatMessage(`eligibility.${appraisal.eligibility}`) : ""}
        saving={reopenMutation.isLoading}
        error={reopenError}
        onCancel={() => {
          setReopening(false);
          setReopenError(null);
        }}
        onSave={saveReopen}
      />
    </div>
  );
}

export default AppraisalPage;
