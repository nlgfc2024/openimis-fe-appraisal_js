import { makeStyles } from "@material-ui/core/styles";

const useAppraisalStyles = makeStyles((theme) => ({
  page: theme.page,
  paper: theme.paper.paper,
  item: theme.paper.item,
  title: theme.paper.title,
  tableTitle: theme.table.title,
  fullHeight: { height: "100%" },
  form: { padding: 0 },
  filterItem: { padding: theme.spacing(1) },
  section: { padding: theme.spacing(1, 2) },
  card: {
    height: "100%",
    backgroundColor: theme.palette?.background?.paper ?? "#fff",
  },
  cardNumber: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: theme.palette?.primary?.main ?? "#006273",
  },
  cardText: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    lineHeight: "3rem",
    color: theme.palette?.primary?.main ?? "#006273",
  },
  tabs: { display: "flex", alignItems: "center" },
  selectedTab: { borderBottom: "4px solid white" },
  unselectedTab: { borderBottom: "4px solid transparent" },
  primaryButton: theme.dialog?.primaryButton ?? {},
  secondaryButton: theme.dialog?.secondaryButton ?? {},
  muted: { color: theme.palette?.text?.secondary },
  warning: { color: theme.palette?.error?.main },
  chips: { display: "flex", gap: theme.spacing(1), flexWrap: "wrap", alignItems: "center" },
}));

export default useAppraisalStyles;
