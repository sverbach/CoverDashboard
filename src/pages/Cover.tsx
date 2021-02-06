import { useState, useEffect, FC } from "react";
import TimeseriesRecord from "../interfaces/TimeseriesRecord";
import Grid from "@material-ui/core/Grid";
import { makeStyles, createStyles, Theme, useTheme  } from "@material-ui/core/styles";
import Paper from '@material-ui/core/Paper';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';
import api from "../utils/api.json";
import ProtocolBarChart from '../components/ProtocolBarChart';
import ProtocolLineChart from '../components/ProtocolLineChart';
import ProtocolAreaChart from '../components/ProtocolAreaChart';
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";
import {apiDataToTimeseriesRecords, getMostRelevantPoolBySymbol} from "../utils/apiDataProc";
import {getAllTypes, getAllTimes} from "../utils/chartTimeAndType";
import {formatCurrency} from "../utils/formatting";
import Protocols from "../interfaces/Protocols";

const useStyles = makeStyles((theme: Theme) => (
  createStyles({
    root: {
      backgroundColor: "#3a3c4d",
      flexGrow: 1,
      marginTop: "10px",
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.primary,
      marginLeft: "20px",
      marginRight: "20px",
      backgroundColor: "#414357"
    },
    tooltip: {
      color: theme.palette.text.secondary,
    },
    avatar: {
      marginBottom: "10px",
      marginRight: "25px"
    },
    heading: {
      paddingTop: "10px"
    },
    infoCard : {
      margin: 0
    }
  })
));

interface PropsProtocol {
  match: {
    params: {
      cover: string;
    };
  };
}

interface tokensInWalletsAndPools {
  claim: {
    pool: number,
    wallet: number
  },
  noclaim: {
    pool: number,
    wallet: number
  }
}

const Cover: FC<PropsProtocol> = (props) => {
  const classes = useStyles();
  const theme = useTheme();
  const chartTimes: string[] = getAllTimes();
  const chartTypes: string[] = getAllTypes();
  const swapFeePercent: number = 0.01;
  const [timeseriesData, setTimeseriesData] = useState<TimeseriesRecord[]>();
  const [chartTypeSelected = chartTypes[0], setChartType] = useState<string>();
  const [chartTimeSelected = chartTimes[3], setChartTime] = useState<string>();
  const [tokens, setTokensInWalletsAndPools] = useState<tokensInWalletsAndPools>();
  

  const ListChartTypes = (props: any) => {
    const types = chartTypes.map((chartType) =>
      <Button key={chartType} variant={(chartTypeSelected === chartType) ? "contained" : "outlined"} color={props.color} 
        size="small" onClick={() => setChartType(chartType)}>
        {chartType}
      </Button>
    );
    return (
      <Grid item xs={5} justify="flex-start" container>{types}</Grid>
    );
  }

  const ListChartTimes = (props: any) => {
    const times = chartTimes.map((chartTime) =>
      <Button key={chartTime} variant={(chartTimeSelected === chartTime) ? "contained" : "outlined"} color={props.color} 
        size="small" onClick={() => setChartTime(chartTime)}>
        {chartTime}
      </Button>
    );
    return (
      <Grid item xs={7} justify="flex-end" container>{times}</Grid>
    );
  }

  const renderChart = (chartType: string | undefined, type: string) => {
    if (timeseriesData) {
      switch(chartType) {
        case chartTypes[0]:
          return (
            <ProtocolLineChart textColor={theme.palette.text.primary} fillColor={(type.toLowerCase() === "claim") ? theme.palette.primary.main : theme.palette.secondary.main}
                  chartTime={chartTimeSelected || chartTimes[3]} data={timeseriesData} xAxisDataKey="timestamp" lineDataKey={`${type.toLowerCase()}.price`}
                    lineLabel={`Price [USD]`}/>
          );
        case chartTypes[1]:
          return (
            <ProtocolBarChart textColor={theme.palette.text.primary} fillColor={(type.toLowerCase() === "claim") ? theme.palette.primary.main : theme.palette.secondary.main}
                  chartTime={chartTimeSelected || chartTimes[3]} data={timeseriesData} xAxisDataKey="timestamp" barDataKey={`${type.toLowerCase()}.swapVol`}
                  barLabel={`Volume [USD]`} filtering={false} />
          );
        case chartTypes[2]:
          return (
            <ProtocolAreaChart textColor={theme.palette.text.primary} fillColor={(type.toLowerCase() === "claim") ? theme.palette.primary.main : theme.palette.secondary.main}
                  chartTime={chartTimeSelected || chartTimes[3]} data={timeseriesData} xAxisDataKey="timestamp" areaDataKey={`${type.toLowerCase()}.liquidity`}
                    areaLabel={`Liquidity [USD]`}/>
          );
        default:
          return (
            <ProtocolLineChart textColor={theme.palette.text.primary} fillColor={(type.toLowerCase() === "claim") ? theme.palette.primary.main : theme.palette.secondary.main}
                  chartTime={chartTimeSelected || chartTimes[3]} data={timeseriesData} xAxisDataKey="timestamp" lineDataKey={`${type.toLowerCase()}.price`}
                    lineLabel={`Price [USD]`}/>
          );
      }
    }
  }

  const renderChartInfo = (type: string, records: TimeseriesRecord[]) => {
    type = type.toLowerCase();
    if (type === "claim" || type === "noclaim") {
      return (
        <Grid container justify="space-between">
          <Grid item xs={12} sm={12}>
            <Paper className={classes.paper} style={{marginTop: "10px"}}>
              <Grid container justify="space-between" alignContent="center">
                <p className={classes.infoCard}>Total Volume</p>
                <p className={classes.infoCard}>{formatCurrency(getNewestRecord(records)[type].swapVolCum)}</p>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12}>
            <Paper className={classes.paper} style={{marginTop: "10px"}}>
              <Grid container justify="space-between" alignContent="center">
                <p className={classes.infoCard}>Total Amount of Swap Fees</p>
                <p className={classes.infoCard}>{formatCurrency(getNewestRecord(records)[type].swapVolCum*swapFeePercent)}</p>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper} style={{marginTop: "10px"}}>
              <Grid container justify="space-between" alignContent="center">
                  <p className={classes.infoCard}>Total Amount in Wallets</p>
                  {tokens ? (
                    <p className={classes.infoCard}>{formatCurrency(tokens[type].wallet)}</p>
                  ): (
                    <LinearProgress color="primary" />
                  )}
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper className={classes.paper} style={{marginTop: "10px"}}>
              <Grid container justify="space-between" alignContent="center">
                  <p className={classes.infoCard}>Total Amount in Pools</p>
                  {tokens ? (
                    <p className={classes.infoCard}>{formatCurrency(tokens[type].pool)}</p>
                  ): (
                    <LinearProgress color="primary" />
                  )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      );
    } else {
      return (
        <div></div>
        );
    }
  }

  const getNewestRecord = (records: TimeseriesRecord[]) => {
    return records[records.length-1];
  }

  useEffect(() => {
    fetch(`${api.timeseries_data_all+props.match.params.cover}`)
      .then((response) => response.json())
      .then((data) => {
        setTimeseriesData(apiDataToTimeseriesRecords(data))
      });
    fetch(api.base_url)
      .then((response) => response.json())
      .then((data) => {
        let filteredProtocols: Protocols[] = data.protocols.filter((p: Protocols) => p.protocolActive === true);
        let selectedProtocol = filteredProtocols.find(p => p.protocolName.toLowerCase() === props.match.params.cover.toLowerCase());
        if(selectedProtocol === undefined) return;
        let [poolIdClaim, claimTokenAddr] = getMostRelevantPoolBySymbol(selectedProtocol.protocolName, true, data.poolData);
        let [poolIdNoClaim, noClaimTokenAddr] = getMostRelevantPoolBySymbol(selectedProtocol.protocolName, false, data.poolData);
        let pools = [poolIdClaim, poolIdNoClaim];
        let graphRequests = pools.map(poolId => fetch(api.the_graph_base_url, {
          method: "POST",
          mode: "cors",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({query: `{
            pool (id: "${poolId}") {
              totalSwapVolume
              totalSwapFee
              tokens {
                symbol
                address
                balance
              }
            }
          }`})
        }));

        Promise.all(graphRequests)
          .then((responses) => {
          Promise.all(responses.map(r=>r.json()))
            .then(allGraphData => {
              let balanceClaim = 0;
              let balanceNoClaim = 0;

              for(let graphData of allGraphData) {
                for(let token of graphData.data.pool.tokens) {
                  if(token.symbol.indexOf(`_${props.match.params.cover.toUpperCase()}_`) > -1) {
                    if(token.symbol.indexOf(`_CLAIM`) > -1) {
                      balanceClaim = token.balance;
                    } else if (token.symbol.indexOf(`_NOCLAIM`) > -1) {
                      balanceNoClaim = token.balance;
                    }
                  }
                }
              }
              if(selectedProtocol === undefined) return;
              let tokenInfo: tokensInWalletsAndPools = {
                claim: {
                  pool: balanceClaim,
                  wallet: selectedProtocol.coverObjects[0].collateralStaked - balanceClaim
                },
                noclaim: {
                  pool: balanceNoClaim,
                  wallet: selectedProtocol.coverObjects[0].collateralStaked - balanceNoClaim
                }
              };
              setTokensInWalletsAndPools(tokenInfo);
            })
        })
      });
  }, []);
  return (
    <div>
      {timeseriesData ? (
      <div>
        <Grid container spacing={3} justify="space-evenly">
          <Grid item xs={12}>
              <Paper className={classes.paper}>
                <Grid className={classes.heading} container justify="center" alignItems="center">
                  <Avatar className={classes.avatar} alt={`${props.match.params.cover} Token`} src={`${process.env.PUBLIC_URL}/images/protocols/${props.match.params.cover}.png`}/>
                  <Typography variant="h4" gutterBottom>
                        {props.match.params.cover.toUpperCase()} Token
                  </Typography>
                </Grid>           
              </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper className={classes.paper}>
              <Grid container justify="center">
                <Grid item>
                  <Link color="inherit" href={api.pool_base_url+getNewestRecord(timeseriesData).claim.poolId}>
                    <Typography variant="h5" gutterBottom>
                      CLAIM Token
                    </Typography>
                  </Link>
                  </Grid>
                </Grid>
                <Grid container justify="space-between" alignItems="center">
                <ListChartTypes color="primary" />
                <ListChartTimes color="primary" />
                <Grid item xs={12}>
                  {renderChart(chartTypeSelected, "CLAIM")}
                </Grid>
              </Grid>
            </Paper>
            <Grid item xs={12} container justify="space-between">
              {renderChartInfo("claim", timeseriesData)}
            </Grid>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper className={classes.paper}>
              <Grid container justify="center">
                <Grid item>
                <Link color="inherit" href={api.pool_base_url+getNewestRecord(timeseriesData).noclaim.poolId}>
                  <Typography variant="h5" gutterBottom>
                  NOCLAIM Token
                </Typography>
                </Link>
                </Grid>
              </Grid>
              <Grid container justify="space-between" alignItems="center">
                <ListChartTypes color="secondary" />
                <ListChartTimes color="secondary" />
                <Grid item xs={12}>
                  {renderChart(chartTypeSelected, "NOCLAIM")}
                </Grid>
              </Grid>
            </Paper>
            <Grid item xs={12} container justify="space-between">
              {renderChartInfo("noclaim", timeseriesData)}
            </Grid>
          </Grid>
        </Grid>
      </div>
      ): (
        <LinearProgress color="primary" />
      )}
    </div>
  );
};

export default Cover;
