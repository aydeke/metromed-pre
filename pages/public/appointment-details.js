/**
 * ./pages/public/appointment-details.js
 */

import { Component } from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { withStyles } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import TextField from 'material-ui/TextField';
import Button from 'material-ui/Button';

import withLayout from '../../lib/withLayout';
import { getDays } from '../../lib/days';

const styles = theme => ({
  root: {
    flexGrow: 1,
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: '100%',
  },
  menu: {
    // width: 200,
  },
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing.unit * 2,
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
});

const services = ['School Physicals', 'Sports Physicals', 'Adult Physicals', 'DOT Physicals'];
const time = ['10 am', '11 am', '12 am', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm'];

class AppointmentDetails extends Component {
  constructor(props) {
    super(props);
    console.log(props.url.query);
  }

  state = {
    currency: 'EUR',
  };

  handleChange = name => (event) => {
    this.setState({
      [name]: event.target.value,
    });
  };

  render() {
    const { classes } = this.props;

    return (
      <div style={{ padding: '10px 45px' }}>
        <Head>
          <title>Appointment Details</title>
          <meta name="description" content="Request an appointment." />
        </Head>

        <h1>Appointment Details</h1>
      </div>
    );
  }
}

AppointmentDetails.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  query: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

export default withLayout(withStyles(styles)(AppointmentDetails));
