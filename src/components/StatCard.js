import React from "react";
import { Card, CardContent, Grid, Typography } from "@material-ui/core";

import { EMPTY_VALUE } from "../constants";
import useAppraisalStyles from "../styles";

function StatCard({ label, value, text = false, xs = 12, sm = 6, md = 2 }) {
  const classes = useAppraisalStyles();
  return (
    <Grid item xs={xs} sm={sm} md={md} className={classes.item}>
      <Card className={classes.card} variant="outlined">
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            {label}
          </Typography>
          <Typography className={text ? classes.cardText : classes.cardNumber}>
            {typeof value === "number" ? value.toLocaleString() : (value ?? EMPTY_VALUE)}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

export default StatCard;
